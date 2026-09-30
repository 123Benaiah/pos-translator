# FastAPI + MongoDB + React Guide (ARCHIVED — unrelated to POS Translator)

> NOTE (chief dev): this is a generic JWT/auth tutorial kept for reference only.
> It does NOT describe this repo — there is no JWT auth, no `auth/items` routers here.
> For this project start at `README.md`, then `docs/ARCHITECTURE.md`, `docs/API.md`,
> `docs/TROUBLESHOOTING.md`, and `DEPLOYMENT.md`.

Step-by-step guide to connect your FastAPI project to local MongoDB, build CRUD APIs with JWT auth, and consume them from React Vite.

---

## 1. Install Dependencies

Activate your venv first, then install everything at once:

```powershell
.\backend\venv\Scripts\Activate.ps1
pip install fastapi uvicorn[standard] pymongo motor python-dotenv passlib[bcrypt] python-jose[cryptography] pydantic pydantic-settings
```

**What each package does:**
| Package | Purpose |
|---|---|
| `fastapi` | Web framework |
| `uvicorn` | ASGI server to run the app |
| `motor` | Async MongoDB driver (preferred for FastAPI) |
| `pymongo` | Sync MongoDB driver (motor depends on it) |
| `python-dotenv` | Load `.env` files for config |
| `passlib[bcrypt]` | Hash passwords |
| `python-jose[cryptography]` | Create/verify JWT tokens |
| `pydantic` | Data validation and schemas |
| `pydantic-settings` | Settings management from env vars |

Then save your dependencies:

```powershell
pip freeze > requirements.txt
```

---

## 2. Project Structure

Create this folder/file structure:

```
fastapi-project/
├── main.py                  # Entry point - app initialization
├── config.py                # Settings from .env
├── database.py              # MongoDB connection
├── models/
│   ├── __init__.py          # Empty file
│   ├── user.py              # User Pydantic models
│   └── item.py              # Item Pydantic models
├── routes/
│   ├── __init__.py          # Empty file
│   ├── auth.py              # Login, register endpoints
│   └── items.py             # CRUD item endpoints
├── auth.py                  # JWT helper functions
├── .env                     # Environment variables (DO NOT commit)
├── requirements.txt
└── docs/
    └── follow-this-guide.md # This file
```

---

## 3. Environment Variables (`.env`)

Create a `.env` file in the project root:

```env
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=fastapi_project
SECRET_KEY=your-super-secret-key-change-this-to-something-random
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

> **IMPORTANT:** Generate a real secret key. Run this in Python to get one:
> ```python
> import secrets
> print(secrets.token_hex(32))
> ```

---

## 4. Config (`config.py`)

This file loads your `.env` variables:

```python
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    mongodb_url: str = "mongodb://localhost:27017"
    database_name: str = "fastapi_project"
    secret_key: str = "change-me"
    access_token_expire_minutes: int = 60

    model_config = {
        "env_file": ".env"
    }


settings = Settings()
```

---

## 5. Database Connection (`database.py`)

This uses `motor` (async MongoDB driver):

```python
from motor.motor_asyncio import AsyncIOMotorClient
from config import settings

client = AsyncIOMotorClient(settings.mongodb_url)
db = client[settings.database_name]

# Collections (tables in SQL terms)
users_collection = db["users"]
items_collection = db["items"]
```

**How it works:**
- `motor` creates an async client that doesn't block FastAPI while waiting for MongoDB
- `db["users"]` creates a `users` collection automatically when you first insert data
- No need to "create" the database or collections — MongoDB creates them on first write

---

## 6. Models

### `models/__init__.py`
Leave this file empty. It just makes `models` a Python package.

### `models/user.py`

```python
from pydantic import BaseModel, EmailStr
from typing import Optional


class UserCreate(BaseModel):
    username: str
    email: str
    password: str


class UserResponse(BaseModel):
    id: str
    username: str
    email: str

    model_config = {
        "from_attributes": True
    }


class UserInDB(BaseModel):
    username: str
    email: str
    hashed_password: str
```

### `models/item.py`

```python
from pydantic import BaseModel
from typing import Optional


class ItemCreate(BaseModel):
    title: str
    description: Optional[str] = None
    price: float


class ItemUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None


class ItemResponse(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    price: float
    owner: str

    model_config = {
        "from_attributes": True
    }
```

---

## 7. Auth Helpers (`auth.py`)

JWT token creation and password hashing:

```python
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from passlib.context import CryptContext
from config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.access_token_expire_minutes
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.secret_key, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict | None:
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None
```

---

## 8. Auth Routes (`routes/auth.py`)

```python
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer
from database import users_collection
from models.user import UserCreate, UserResponse
from auth import hash_password, verify_password, create_access_token, decode_access_token

router = APIRouter(prefix="/auth", tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


@router.post("/register", response_model=UserResponse)
async def register(user: UserCreate):
    existing = await users_collection.find_one({"$or": [
        {"email": user.email},
        {"username": user.username}
    ]})
    if existing:
        raise HTTPException(status_code=400, detail="Email or username already taken")

    user_doc = {
        "username": user.username,
        "email": user.email,
        "hashed_password": hash_password(user.password),
    }
    result = await users_collection.insert_one(user_doc)

    return UserResponse(
        id=str(result.inserted_id),
        username=user.username,
        email=user.email,
    )


@router.post("/login")
async def login(user: UserCreate):
    db_user = await users_collection.find_one({"username": user.username})
    if not db_user or not verify_password(user.password, db_user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token(data={"sub": str(db_user["_id"]), "username": db_user["username"]})
    return {"access_token": token, "token_type": "bearer"}


async def get_current_user(token: str = Depends(oauth2_scheme)):
    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user = await users_collection.find_one({"_id": payload["sub"]})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user
```

---

## 9. Item CRUD Routes (`routes/items.py`)

```python
from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId
from database import items_collection
from models.item import ItemCreate, ItemUpdate, ItemResponse
from routes.auth import get_current_user

router = APIRouter(prefix="/items", tags=["items"])


@router.get("/", response_model=list[ItemResponse])
async def get_items():
    items = await items_collection.find().to_list(100)
    return [
        ItemResponse(
            id=str(item["_id"]),
            title=item["title"],
            description=item.get("description"),
            price=item["price"],
            owner=item["owner"],
        )
        for item in items
    ]


@router.get("/{item_id}", response_model=ItemResponse)
async def get_item(item_id: str):
    item = await items_collection.find_one({"_id": ObjectId(item_id)})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return ItemResponse(
        id=str(item["_id"]),
        title=item["title"],
        description=item.get("description"),
        price=item["price"],
        owner=item["owner"],
    )


@router.post("/", response_model=ItemResponse)
async def create_item(item: ItemCreate, user=Depends(get_current_user)):
    item_doc = {
        "title": item.title,
        "description": item.description,
        "price": item.price,
        "owner": str(user["_id"]),
    }
    result = await items_collection.insert_one(item_doc)
    return ItemResponse(
        id=str(result.inserted_id),
        title=item.title,
        description=item.description,
        price=item.price,
        owner=str(user["_id"]),
    )


@router.put("/{item_id}", response_model=ItemResponse)
async def update_item(item_id: str, item: ItemUpdate, user=Depends(get_current_user)):
    existing = await items_collection.find_one({"_id": ObjectId(item_id)})
    if not existing:
        raise HTTPException(status_code=404, detail="Item not found")
    if existing["owner"] != str(user["_id"]):
        raise HTTPException(status_code=403, detail="Not authorized")

    update_data = {k: v for k, v in item.model_dump().items() if v is not None}
    await items_collection.update_one({"_id": ObjectId(item_id)}, {"$set": update_data})

    updated = await items_collection.find_one({"_id": ObjectId(item_id)})
    return ItemResponse(
        id=str(updated["_id"]),
        title=updated["title"],
        description=updated.get("description"),
        price=updated["price"],
        owner=updated["owner"],
    )


@router.delete("/{item_id}")
async def delete_item(item_id: str, user=Depends(get_current_user)):
    existing = await items_collection.find_one({"_id": ObjectId(item_id)})
    if not existing:
        raise HTTPException(status_code=404, detail="Item not found")
    if existing["owner"] != str(user["_id"]):
        raise HTTPException(status_code=403, detail="Not authorized")

    await items_collection.delete_one({"_id": ObjectId(item_id)})
    return {"detail": "Item deleted"}
```

---

## 10. Update `main.py`

Replace your current `main.py` with:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import auth, items

app = FastAPI(title="FastAPI + MongoDB")

# Allow React dev server to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(items.router)


@app.get("/")
def home():
    return {"message": "API is running"}
```

---

## 11. Run It

```powershell
# Make sure MongoDB is running locally on port 27017
# Start the FastAPI server:
uvicorn main:app --reload
```

Visit `http://localhost:8000/docs` to see the auto-generated Swagger UI where you can test all endpoints.

---

## 12. React Frontend Integration

### Install axios in your React project:

```bash
npm install axios
```

### Create an API client (`src/api.js`):

```javascript
import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8000",
});

// Attach JWT token to every request automatically
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;
```

### Example usage in a React component:

```jsx
import API from "./api";

// Register
const register = async (username, email, password) => {
  const res = await API.post("/auth/register", { username, email, password });
  console.log(res.data);
};

// Login
const login = async (username, password) => {
  const res = await API.post("/auth/login", { username, password });
  localStorage.setItem("token", res.data.access_token);
};

// Get items
const getItems = async () => {
  const res = await API.get("/items/");
  return res.data;
};

// Create item
const createItem = async (title, description, price) => {
  const res = await API.post("/items/", { title, description, price });
  return res.data;
};

// Delete item
const deleteItem = async (id) => {
  await API.delete(`/items/${id}`);
};
```

---

## API Endpoints Summary

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | No | Create account |
| `POST` | `/auth/login` | No | Login, get JWT |
| `GET` | `/items/` | No | List all items |
| `GET` | `/items/{id}` | No | Get single item |
| `POST` | `/items/` | **Yes** | Create item |
| `PUT` | `/items/{id}` | **Yes** | Update item (owner only) |
| `DELETE` | `/items/{id}` | **Yes** | Delete item (owner only) |

---

## Troubleshooting

**MongoDB connection error:**
- Make sure MongoDB is running: `mongosh` or check MongoDB Compass
- Default port is `27017`

**CORS error in React:**
- Make sure `allow_origins` in `main.py` includes your React dev server URL (`http://localhost:5173`)

**ModuleNotFoundError:**
- Make sure your venv is activated: `.\backend\venv\Scripts\Activate.ps1`
- Make sure packages are installed: `pip install -r requirements.txt`

**`__pycache__` issues:**
- Add `__pycache__/` to a `.gitignore` if using git

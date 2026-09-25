export default function Logo() {
  return (
    <div className="flex items-center gap-3 px-4 py-6">
      <div className="relative flex h-11 w-11 items-center justify-center rounded-full gradient-purple ring-2 ring-gold-400">
        <span className="text-xl font-bold text-white font-display">T</span>
      </div>
      <div>
        <h1 className="text-lg font-bold text-white font-display tracking-wide">
          Translator
        </h1>
        <p className="text-[10px] uppercase tracking-[0.2em] text-orange-300">
          EN · Lozi · Bemba
        </p>
      </div>
    </div>
  );
}

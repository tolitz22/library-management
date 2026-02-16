export function Progress({ value = 0 }: { value?: number }) {
  return (
    <div className="h-3 w-full overflow-hidden rounded-full border-[2px] border-[#1E1E1E] bg-white">
      <div className="h-full bg-[#00C9A7] transition-all" style={{ width: `${value}%` }} />
    </div>
  );
}

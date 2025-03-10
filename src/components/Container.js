export default function Container({ children, heading }) {
  return (
    <div className="text-white my-6 p-0.5 w-full rounded-lg magic-gradient flex flex-col">
      <div className="w-full px-6  py-10 h-full bg-[#1F0317] rounded-lg">
        <h3 className="text-2xl font-display">{heading}</h3>
        {children}
      </div>
    </div>
  );
};
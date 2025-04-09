export default function MagicBorder({ children }) {
  return (
    <div className="bg-gradient-to-r from-red-magic to-blue-magic hover:from-blue-magic hover:to-red-magic p-[1px] rounded-lg">
      {children}
    </div>
  )
}
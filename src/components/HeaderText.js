export default function HeaderText({ header, description }) {
  return (
    <div>
      <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-white mb-2 md:mb-3 leading-tight">
        {header}
      </h2>
      {description && (
        <p className="text-xs sm:text-sm md:text-base font-display text-white/70 max-w-2xl mx-auto leading-relaxed px-1">
          {description}
        </p>
      )}
    </div>
  );
};

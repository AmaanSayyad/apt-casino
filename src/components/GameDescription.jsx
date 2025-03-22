import Image from "next/image";

const GameDescription = ({ data }) => (
  <div className="flex flex-col mt-10 rounded-lg shadow-lg">
    <div className="flex flex-col md:flex-row gap-6">
      {/* Image Section */}
      <div className="w-full max-w-96">
        <Image
          src={data.image}
          alt={data.title}
          layout="responsive"
          width={16}
          height={9}
          className="rounded-lg object-cover shadow-md"
        />
      </div>

      {/* Description Section */}
      <div className="text-gray-300 w-full">
        <h1 className="text-3xl font-semibold text-white">{data.label}</h1>
        <p className="mt-4 leading-relaxed">{data.paragraphs[0]}</p>
      </div>
    </div>

    {/* Title and Paragraphs */}
    <div className="mt-8">
      <h1 className="text-3xl font-semibold text-white">{data.title}</h1>
      {data.paragraphs.map((paragraph, index) => (
        <p key={index} className="mt-4 leading-relaxed text-gray-300">
          {paragraph}
        </p>
      ))}
    </div>
  </div>
);

export default GameDescription;

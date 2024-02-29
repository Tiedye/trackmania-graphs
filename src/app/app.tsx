import { ButtonHTMLAttributes, useState } from 'react';

const Bar = ({ input, output }: { input: number; output: number }) => (
  <div className="relative h-10 py-1">
    <div
      className="h-full overflow-clip transition-all duration-500"
      style={{
        clipPath: `rect(auto auto auto auto round 4px)`,
        width: `${input}%`,
      }}
    >
      <div
        className="h-full bg-gradient-to-r from-orange-300 to-red-600 transition-all duration-500"
        style={{ width: `${10000 / output}%` }}
      >
        <svg
          viewBox="0 0 50 10"
          preserveAspectRatio="none"
          className="h-full w-full stroke-black stroke-[4]"
        >
          {Array(49)
            .fill(0)
            .map((_, i) => i + 1)
            .map((i) => (
              <line
                vectorEffect="non-scaling-stroke"
                strokeLinecap="round"
                x1={i}
                x2={i}
                y1={10}
                y2={i % 5 === 0 ? 5 : 8}
                key={i}
              />
            ))}
        </svg>
      </div>
    </div>
  </div>
);

const Key = (props: ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    className="aspect-square h-8 rounded border-4 border-solid border-t-gray-300 border-l-gray-300 border-r-gray-600 border-b-gray-600 bg-gray-200 font-bold text-slate-800 hover:bg-gray-50 active:border-b-gray-300 active:border-r-gray-300 active:border-l-gray-600 active:border-t-gray-600 active:bg-gray-300"
    {...props}
  />
);

const Graph = () => {
  const [actionKey, setActionKey] = useState(20);

  return (
    <div className="grid gap-3">
      <div className="font-bold">
        Before
        <Bar input={actionKey} output={actionKey} />
      </div>
      <div className="font-bold">
        After
        <Bar input={100} output={actionKey} />
      </div>
      <div className="flex gap-1 py-2">
        <Key onClick={() => setActionKey(20)}>1</Key>
        <Key onClick={() => setActionKey(40)}>2</Key>
        <Key onClick={() => setActionKey(60)}>3</Key>
        <Key onClick={() => setActionKey(80)}>4</Key>
      </div>
    </div>
  );
};

export default () => {
  return (
    <div className="dark:bg-slate-800">
      <section className="container mx-auto grid h-full h-screen content-center px-4 dark:text-white  ">
        {/* <header className="pb-3 text-4xl font-extrabold">
        Trackmania Action Keys Update
      </header> */}
        <Graph />
      </section>
    </div>
  );
};

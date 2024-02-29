import { ButtonHTMLAttributes, useEffect, useRef, useState } from 'react';

import { ReactComponent as SteeringWheel } from '../assets/steering-wheel.svg';

import { useDeviceOrientation } from "./useDeviceOrientation";

const useDefined = <T,>(v: T): T => {
  const ref = useRef(v);
  if (v) {
    ref.current = v;
  }
  return ref.current;
};

const useKeybind = (
  binding: Partial<
    Pick<KeyboardEvent, 'key' | 'altKey' | 'shiftKey' | 'ctrlKey' | 'metaKey'>
  >,
  action: () => void,
) => {
  const { key, altKey, ctrlKey, metaKey, shiftKey } = binding;
  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if (
        (key == null || key === event.key) &&
        (altKey == null || altKey === event.altKey) &&
        (ctrlKey == null || ctrlKey === event.ctrlKey) &&
        (metaKey == null || metaKey === event.metaKey) &&
        (shiftKey == null || shiftKey === event.shiftKey)
      ) {
        action();
        event.preventDefault();
      }
    };
    document.addEventListener('keydown', listener);
    return () => document.removeEventListener('keydown', listener);
  }, [key, altKey, ctrlKey, metaKey, shiftKey, action]);
};

const Bar = ({
  inputRange,
  outputRange,
  input,
}: {
  inputRange: number;
  outputRange: number;
  input?: number;
}) => {
  const lastInput = useDefined(input);
  return (
    <div className="relative h-10 py-1">
      <div
        className="h-full overflow-clip transition-all duration-500"
        style={{
          clipPath: `rect(auto auto auto auto round 4px)`,
          width: `${inputRange}%`,
        }}
      >
        <div
          className="h-full bg-gradient-to-r from-orange-300 to-red-600 transition-all duration-500"
          style={{ width: `${10000 / outputRange}%` }}
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
      {lastInput != null && (
        <svg
          viewBox="0 0 10 10"
          className="relative h-4 overflow-visible fill-green-600 transition-opacity duration-200"
          style={{
            left: `${Math.min(inputRange, lastInput)}%`,
            opacity: input == null ? '0' : undefined,
          }}
        >
          <polygon
            points="0,1 4,9 -4,9"
            className={lastInput > inputRange ? 'fill-red-500' : ''}
          />
        </svg>
      )}
    </div>
  );
};

const Key = (props: ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    className="aspect-square h-8 rounded border-4 border-solid border-t-gray-300 border-l-gray-300 border-r-gray-600 border-b-gray-600 bg-gray-200 font-bold text-slate-800 hover:bg-gray-50 active:border-b-gray-300 active:border-r-gray-300 active:border-l-gray-600 active:border-t-gray-600 active:bg-gray-300"
    {...props}
  />
);

const Wheel = ({
  onInput,
  input,
}: {
  onInput: (value: number | undefined) => void;
  input: number | undefined;
}) => {
  const [{ angle, rotations }, setState] = useState({ angle: 0, rotations: 0 });
  const [isGyro, setIsGyro] = useState(false);
  const [initialAlpha, setInitialAlpha] = useState<number | null>(null);
  const { orientation, requestAccess, revokeAccess, error: orientationError } = useDeviceOrientation();

  useEffect(() => {
    if (!angle && !rotations) {
      onInput(undefined);
      return;
    }
    const normalizedAngle = (angle + 2 * Math.PI * rotations) / Math.PI;
    onInput(normalizedAngle * 100);
  }, [angle, rotations, onInput]);

  const handleSetAngle = (newAngle: number | undefined) => {
    setState(({ angle, rotations }) => {
      if (newAngle == null) {
        return { angle: 0, rotations: 0 };
      }
      const rotationDelta = (() => {
        if (newAngle < angle - Math.PI) {
          return 1;
        }
        if (newAngle > angle + Math.PI) {
          return -1;
        }
        return 0;
      })();
      return {
        angle: newAngle,
        rotations: Math.max(-2, Math.min(rotations + rotationDelta, 2)),
      };
    });
  };

  const clampedAngle = Math.max(
    -Math.PI,
    Math.min(angle + 2 * Math.PI * rotations, Math.PI),
  );

  const renderAngle = clampedAngle
    ? clampedAngle
    : input
      ? (input / 100) * Math.PI
      : 0;

  useEffect(() => {
    const rotate180 = (x: number) => (x + 180 > 360 ? x - 180 : x + 180);
    if(!orientationError && orientation && initialAlpha === null) {
      setInitialAlpha(rotate180(orientation.alpha || 0));
    } else if(!orientationError && orientation && initialAlpha !== null) {
      const angle = ((orientation.gamma || 0) > 0) ? 90 - (orientation.beta || 0) : (orientation.beta || 0) - 90;
      handleSetAngle((angle * 3) / 180 * Math.PI);
    }
  }, [initialAlpha, orientation, orientation?.alpha, orientationError]);

  return (
    <>
      {orientationError?.message}
      <SteeringWheel
        onTouchEnd={(e) => {
          if(!isGyro) {
            requestAccess().then(() => {
              setIsGyro(true)
            });
          } else {
            handleSetAngle(undefined);
            revokeAccess().then(() => {
              setIsGyro(false)
            });
          }

        }}
        onMouseDown={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          const initialAngle = Math.atan2(
            e.clientY - centerY,
            e.clientX - centerX,
          );
          handleSetAngle(0);
          const controller = new AbortController();
          const signal = controller.signal;

          document.body.style.cursor = 'grabbing';

          const finish = () => {
            document.body.style.cursor = '';

            controller.abort();
            handleSetAngle(undefined);
          };
          document.addEventListener(
            'mousemove',
            (e) => {
              const currentAngle = Math.atan2(
                e.clientY - centerY,
                e.clientX - centerX,
              );
              handleSetAngle(currentAngle - initialAngle);
            },
            { signal },
          );
          document.body.addEventListener('mouseleave', finish, {
            signal,
          });
          document.addEventListener('mouseup', finish, {
            signal,
          });
        }}
        className="h-24 cursor-grab fill-slate-100 "
        style={{ transform: `rotate(${renderAngle}rad)` }}
      />
      Drag or Tap to drive!
      {/*{isGyro ? (*/}
      {/*  <div className={"text-gray-100 text-sm"} style={{fontFamily: "courier new"}}>*/}
      {/*    {Math.floor(orientation?.alpha || 0)} / {Math.floor(orientation?.beta || 0)} / {Math.floor(orientation?.gamma || 0)} / {Math.floor(angle / Math.PI * 180)}*/}
      {/*  </div>*/}
      {/*) : null}*/}
    </>
  );
};

const Graph = () => {
  const [actionKey, setActionKey] = useState(20);
  const [wheelInput, setWheelInput] = useState<number>();
  const [keyInput, setKeyInput] = useState<number>();

  useKeybind({ key: '1' }, () => setActionKey(20));
  useKeybind({ key: '2' }, () => setActionKey(40));
  useKeybind({ key: '3' }, () => setActionKey(60));
  useKeybind({ key: '4' }, () => setActionKey(80));

  useEffect(() => {
    let rightArrowDown = false;
    let leftArrowDown = false;
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') {
        rightArrowDown = true;
      }
      if (e.key === 'ArrowLeft') {
        leftArrowDown = true;
      }
    });
    document.addEventListener('keyup', (e) => {
      if (e.key === 'ArrowRight') {
        rightArrowDown = false;
      }
      if (e.key === 'ArrowLeft') {
        leftArrowDown = false;
      }
    });
    let lastTime = Date.now();
    const callback = () => {
      const newTime = Date.now();
      const delta = (newTime - lastTime) / 1000;
      lastTime = newTime;
      frame = requestAnimationFrame(callback);
      setKeyInput((input) => {
        const lastInput = input ?? 0;
        if (Math.abs(lastInput) < 1 && !leftArrowDown && !rightArrowDown) {
          return undefined;
        }
        if (delta === 0) return lastInput;
        if (!leftArrowDown && !rightArrowDown) {
          return lastInput * Math.pow(0.2, delta);
        }
        if (leftArrowDown) {
          return -100 - (-100 - lastInput) * Math.pow(0.2, delta);
        }
        if (rightArrowDown) {
          return 100 - (100 - lastInput) * Math.pow(0.2, delta);
        }
        return 0;
      });
    };
    let frame = requestAnimationFrame(callback);
    return () => cancelAnimationFrame(frame);
  }, []);

  const input = wheelInput ?? keyInput;

  const absInput = input ? Math.abs(input) : input;

  return (
    <div className="grid gap-3">
      <div className="font-bold">
        Before{absInput && <> - {Math.min(Math.round(absInput), actionKey)}%</>}
        <Bar inputRange={actionKey} outputRange={actionKey} input={absInput} />
      </div>
      <div className="font-bold">
        After
        {absInput && (
          <>
            {' '}
            - {Math.min(Math.round((absInput * actionKey) / 100), actionKey)}%
          </>
        )}
        <Bar inputRange={100} outputRange={actionKey} input={absInput} />
      </div>
      <div className="flex gap-1 py-2">
        <Key onClick={() => setActionKey(20)}>1</Key>
        <Key onClick={() => setActionKey(40)}>2</Key>
        <Key onClick={() => setActionKey(60)}>3</Key>
        <Key onClick={() => setActionKey(80)}>4</Key>
      </div>
      <Wheel onInput={setWheelInput} input={keyInput} />
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

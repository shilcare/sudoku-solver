import React, { useState } from "react";
import "./main.css";
import { Solver } from "./solver";

export function Main() {
  const [values, setValues] = useState<number[]>(
    Array.from(
      // "600380050001000386500091000807009000000000570026857409045010700000000005780036000",
      // "000074005000000200000305076009402080180060000030000000200500800350001000008000900",
      // "050409007002830056010700800160002040020000060003106002000010000470208005096300080",
      // "605020000230041870740800900000290481007080000020034050170005000000000000003002547",
      // "830002000215400000900001000400060030070000080080040009000600001000005923000100058",
      // "000713500400009008000000700800000604010326050905000003002000000600400001001682000",
      // "001006052000000900030052081600000040800643005010000009540980030008000000390100800",
      // "500800700082030605070400189000023094000105000230940000793006050405070910001004006",
      "060520017000001000800000040006000500000900000050730002030009000004310070000006001",
      Number
    )
  );

  const [highlightedCell, setHighlightedCell] = useState<number>(-1);
  const [numberPadPosition, setNumberPadPosition] = useState<{
    top: number;
    left: number;
  }>({ top: 0, left: 0 });
  const [solutions, setSolutions] = useState<number[][] | undefined>(undefined);
  const highlightedCellRef = React.useRef<number>(highlightedCell);
  highlightedCellRef.current = highlightedCell;
  const onCellClick = React.useCallback(
    (id: number, rect: { top: number; left: number }) => {
      setHighlightedCell(id);
      setNumberPadPosition(rect);
    },
    []
  );
  const onNumberPicked = React.useCallback((value: number) => {
    if (highlightedCellRef.current === -1) {
      return;
    }
    setValues((values) => {
      const newValues = [...values];
      newValues[highlightedCellRef.current] = value;
      return newValues;
    });
    setHighlightedCell(-1);
  }, []);

  const onSolveClick = React.useCallback(() => {
    const solutions = Solver.solve(values);
    setSolutions(solutions);
  }, [values]);

  React.useEffect(() => {
    const matchDarkTheme = window.matchMedia("(prefers-color-scheme: dark)");
    const setThemeAttribute = (e: MediaQueryListEvent) => {
      document.documentElement.setAttribute(
        "data-theme",
        e.matches ? "dark" : "light"
      );
    };

    matchDarkTheme.addEventListener("change", setThemeAttribute);
    setThemeAttribute({
      matches: matchDarkTheme.matches,
    } as MediaQueryListEvent);

    return () => {
      matchDarkTheme.removeEventListener("change", setThemeAttribute);
    };
  }, []);

  return (
    <>
      <div id="board">
        {values.map((v, i) => (
          <Cell
            value={v}
            id={i}
            key={i}
            onCellClick={onCellClick}
            highlighted={highlightedCell === i}
          />
        ))}
        {highlightedCell === -1 ? null : (
          <NumberPad
            onNumberPicked={onNumberPicked}
            position={numberPadPosition}
          />
        )}
      </div>
      <button className="solve-btn" onClick={onSolveClick}>
        Solve
      </button>
      {solutions === undefined ? null : (
        <>
          <div className="solutions-count">
            Found {solutions.length} solution(s)
          </div>
          {solutions.map((solution, i) => (
            <Solution key={i} solution={solution} />
          ))}
        </>
      )}
    </>
  );
}

const Cell = (props: {
  value: number;
  id: number;
  onCellClick?: (id: number, rect: { top: number; left: number }) => void;
  highlighted?: boolean;
}) => {
  const computedClasses = ["cell", props.highlighted ? "highlighted" : ""].join(
    " "
  );
  const ref = React.useRef<HTMLDivElement>(null);
  const onClick = React.useCallback(() => {
    props.onCellClick?.(props.id, ref.current!.getBoundingClientRect());
  }, []);
  return (
    <div
      id={`cell-${props.id}`}
      ref={ref}
      className={computedClasses}
      onClick={onClick}
    >
      {props.value > 0 ? props.value : ""}
    </div>
  );
};

const NumberPad = React.memo(
  (props: {
    position: { top: number; left: number };
    onNumberPicked: (v: number) => void;
  }) => {
    const style = React.useMemo(() => {
      return {
        top: `${props.position.top}px`,
        left: `${props.position.left}px`,
      };
    }, [props.position]);
    const onClearClick = React.useCallback(() => {
      props.onNumberPicked(0);
    }, []);
    return (
      <div id="number-pad" style={style}>
        {Array.from({ length: 9 }, (_, i) => (
          <NumberButton
            key={i}
            value={i + 1}
            onNumberClick={props.onNumberPicked}
          />
        ))}
        <ClearButton onClick={onClearClick} />
      </div>
    );
  }
);

const ClearButton = React.memo((props: { onClick: () => void }) => {
  return (
    <button className="clear-btn" onClick={props.onClick}>
      Clear
    </button>
  );
});

const NumberButton = React.memo(
  ({
    value,
    onNumberClick,
  }: {
    value: number;
    onNumberClick: (v: number) => void;
  }) => {
    const onClick = React.useCallback(() => {
      onNumberClick(value);
    }, [value]);

    return (
      <button className="number-btn" onClick={onClick}>
        {value}
      </button>
    );
  }
);

const Solution = React.memo((props: { solution: number[] }) => (
  <div className="solution">
    {props.solution.map((v, i) => (
      <Cell value={v} id={i} key={i} />
    ))}
  </div>
));

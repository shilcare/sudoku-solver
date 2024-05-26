export class Solver {
  /**
   * Add a candidate row in DLX for when Cell(r, c) is filled with value v
   * @param r row index
   * @param c col index
   * @param v cell value
   */
  private static addCandidate(dlx: DLX, r: number, c: number, v: number): void {
    const rowMetadata = new RowMetadata(r, c, v);
    let startIdx = 0;
    const rowHead = dlx.addDataNode(
      dlx.columns[startIdx + r * 9 + c],
      rowMetadata
    ); // cell constraint

    startIdx += 81;
    let node = dlx.addDataNode(
      dlx.columns[startIdx + r * 9 + v - 1],
      rowMetadata
    ); // row constraint
    node.left = rowHead.left;
    node.left.right = node;
    node.right = rowHead;
    rowHead.left = node;

    startIdx += 81;
    node = dlx.addDataNode(dlx.columns[startIdx + c * 9 + v - 1], rowMetadata); // column constraint
    node.left = rowHead.left;
    node.left.right = node;
    node.right = rowHead;
    rowHead.left = node;

    startIdx += 81;
    const box = Math.floor(r / 3) * 3 + Math.floor(c / 3);
    node = dlx.addDataNode(
      dlx.columns[startIdx + box * 9 + v - 1],
      rowMetadata
    ); // box constraint
    node.left = rowHead.left;
    node.left.right = node;
    node.right = rowHead;
    rowHead.left = node;
  }

  private static algorithmX(
    dlx: DLX,
    rowCandidates: RowMetadata[],
    solutions: number[][]
  ): void {
    // algorithm X
    if (dlx.root.right === dlx.root) {
      // We found a solution
      solutions.push(
        rowCandidates
          .toSorted((a, b) => a.row * 9 + a.col - (b.row * 9 + b.col))
          .map((r) => r.value)
      );
      return;
    }
    const column = dlx.columnWithMinimumSize();
    if (column.size === 0) {
      // No solution, backtrack
      return;
    }
    dlx.cover(column);
    for (let i = column.down; i !== column; i = i.down) {
      rowCandidates.push(i.rowMetadata!);
      for (let j = i.right; j !== i; j = j.right) {
        dlx.cover(j.column!);
      }
      Solver.algorithmX(dlx, rowCandidates, solutions);
      rowCandidates.pop();
      for (let j = i.left; j !== i; j = j.left) {
        dlx.uncover(j.column!);
      }
    }

    dlx.uncover(column);
  }

  public static solve(values: number[]): number[][] {
    if (values.length !== 81) {
      throw new Error(
        "Invalid input, expected 81 values, use 0 for empty cells"
      );
    }

    const dlx = new DLX();

    Array.from({ length: 81 * 4 }).forEach((_, i) => {
      dlx.addColumn(i.toString());
    });

    Array.from({ length: 81 }).forEach((_, i) => {
      const row = Math.floor(i / 9);
      const col = i % 9;
      values[i] === 0
        ? Array.from({ length: 9 }).forEach((_, v) => {
            // Add a row in DLX binary matrix for each possible value (1-9)
            Solver.addCandidate(dlx, row, col, v + 1);
          })
        : Solver.addCandidate(dlx, row, col, values[i]);
    });

    const solutions: number[][] = [];
    Solver.algorithmX(dlx, [], solutions);

    return solutions;
  }
}

/**
 * Dancing Links
 */
class DLX {
  /**
   * header node of the columns
   */
  public root: ColumnNode;
  public columns: ColumnNode[] = [];

  constructor() {
    this.root = new ColumnNode("root");
  }

  public columnWithMinimumSize(): ColumnNode {
    // find column with smallest size
    let minSizeColumn = this.root.right;
    for (let i = this.root.right; i !== this.root; i = i.right) {
      if ((i as ColumnNode).size < (minSizeColumn as ColumnNode).size) {
        minSizeColumn = i;
      }
    }
    return minSizeColumn as ColumnNode;
  }

  public addColumn(name: string): ColumnNode {
    const column = new ColumnNode(name);
    column.left = this.root.left;
    column.left.right = column;
    column.right = this.root;
    this.root.left = column;
    this.columns.push(column);
    return column;
  }

  public addDataNode(column: ColumnNode, rowMetadata: RowMetadata): DataNode {
    const node = new DataNode(column, rowMetadata);
    node.down = column;
    node.up = column.up;
    node.up.down = node;
    column.up = node;
    column.size++;
    return node;
  }

  public cover(column: ColumnNode): void {
    column.right.left = column.left;
    column.left.right = column.right;
    for (let i = column.down; i !== column; i = i.down) {
      for (let j = i.right; j !== i; j = j.right) {
        j.down.up = j.up;
        j.up.down = j.down;
        j.column!.size!--;
      }
    }
  }

  public uncover(column: ColumnNode): void {
    for (let i = column.up; i !== column; i = i.up) {
      for (let j = i.left; j !== i; j = j.left) {
        j.column!.size!++;
        j.down.up = j;
        j.up.down = j;
      }
    }
    column.right.left = column;
    column.left.right = column;
  }
}

class DataNode {
  public readonly column?: ColumnNode;
  public rowMetadata?: RowMetadata;
  public left: DataNode = this;
  public right: DataNode = this;
  public up: DataNode = this;
  public down: DataNode = this;

  constructor(column?: ColumnNode, rowMetadata?: RowMetadata) {
    this.column = column;
    this.rowMetadata = rowMetadata;
  }
}

class ColumnNode extends DataNode {
  constructor(public name: string, public size = 0) {
    super();
  }
}

/**
 * Metadata representing filling a value in a cell
 */
class RowMetadata {
  constructor(public row: number, public col: number, public value: number) {}
}

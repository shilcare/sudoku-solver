import React from "react";
import { SERVER_ORIGIN } from "./constants";

export interface IProcessStatusProps {
  sessionId: string;
  onCellValueReceived: (cellIndex: number, cellValue: number) => void;
  onOcrFinished: () => void;
}

export const ProcessStatus = React.memo(
  ({ sessionId, onCellValueReceived, onOcrFinished }: IProcessStatusProps) => {
    React.useEffect(() => {
      const params = new URLSearchParams({
        sessionId: sessionId,
      });
      const sse = new EventSource(`${SERVER_ORIGIN}/process-status?${params}`);
      sse.onmessage = e => {
        const data = JSON.parse(e.data);
        const { cellIndex, cellValue } = data;

        if (!Number.isInteger(cellIndex) || cellIndex < 0 || cellIndex >= 81) {
          console.error("Invalid cell index received", cellIndex, cellValue);
          return;
        }
        if (!Number.isInteger(cellValue) || cellValue < 0 || cellValue > 9) {
          console.error("Invalid cell value received", cellIndex, cellValue);
          return;
        }
        onCellValueReceived(cellIndex, cellValue);
      };
      sse.onerror = e => {
        console.error("error occurred, close", e);
        sse.close();
      };
      sse.addEventListener("complete", e => {
        console.log("complete!", e);
        onOcrFinished();
        sse.close();
      });
      return () => {
        sse.close();
      };
    }, [onCellValueReceived, onOcrFinished, sessionId]);

    return (
      <div className="process-status">
        You can edit the cell if the OCR result is incorrect.
      </div>
    );
  }
);
ProcessStatus.displayName = "ProcessStatus";

import React from "react";

interface IFilePickerProps {
  onFileChange: (file: File) => void;
}

export const FilePicker = React.memo(({ onFileChange }: IFilePickerProps) => {
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null);

  const onChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        if (file.type !== "image/png") {
          alert("Please upload a PNG file");
          return;
        }
        setSelectedImage(URL.createObjectURL(file));
        onFileChange(file);
      }
    },
    [onFileChange]
  );

  return (
    <div className="step-1">
      <form>
        <fieldset>
          <legend>Upload Sudoku Puzzle</legend>
          <label className="step-description">
            Upload screenshot of the sudoku grid from Wechat for Mac/PC
          </label>
          <input type="file" accept=".png" onChange={onChange} />
          <div className="selected-image">
            {selectedImage && (
              <img
                src={selectedImage}
                alt="Selected"
                style={{ width: "200px", height: "200px" }}
              />
            )}
          </div>
        </fieldset>
      </form>
    </div>
  );
});
FilePicker.displayName = "FilePicker";

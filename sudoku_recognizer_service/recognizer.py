# cSpell:disable
import cv2
import numpy as np
import pytesseract


def is_contour_good(c):
    """
    This function checks if a contour is a good candidate for a Sudoku grid cell.
    Returns a tuple of 3 values:
    - A boolean indicating if the contour is a good candidate.
    - The area of the contour.
    - The approximated shape of the contour.
    """
    perimeter = cv2.arcLength(c, True)
    approx = cv2.approxPolyDP(c, 0.03 * perimeter, True)
    x, y, width, height = cv2.boundingRect(approx)
    aspect_ratio = float(width) / height
    area = cv2.contourArea(c)
    # 4200 and 5000 are from experimentation, may need to be adjusted
    return (
        4200 < area < 5000 and 0.8 <= aspect_ratio <= 1.2,
        area,
        approx,
    )


def recognize(img):
    """
    recognize sudoku from given image
    """
    img_area = img.shape[0] * img.shape[1]
    gray_img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    binary_img = cv2.adaptiveThreshold(
        gray_img, 255, cv2.ADAPTIVE_THRESH_MEAN_C, cv2.THRESH_BINARY, 11, 2
    )
    contours, hierarchy = cv2.findContours(
        binary_img, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE
    )
    selected_contours = [c for c in contours if is_contour_good(c)[0]]

    boundingBoxes = [cv2.boundingRect(c) for c in selected_contours]
    assert (
        len(boundingBoxes) == 81
    ), f"Expected 81 bounding boxes, got {len(boundingBoxes)}"
    average_height = sum([h for (_, _, _, h) in boundingBoxes]) / len(boundingBoxes)
    # sort the boxes row by row
    boundingBoxes = sorted(
        boundingBoxes,
        # sort by row number(calculated by dividing the y-coordinate by the height) and then x-coordinate
        key=lambda rect: (rect[1] // average_height, rect[0]),
    )
    cropped_images = []
    for x, y, w, h in boundingBoxes:
        # Crop the cell from the image
        cropped_images.append(binary_img[y : y + h, x : x + w])

    cell_values = []
    for i, cell in enumerate(cropped_images):
        r, c = divmod(i, 9)
        contours, hierarchy = cv2.findContours(
            cell, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE
        )
        contour_areas = [cv2.contourArea(contour) for contour in contours]
        # Sort the contours by area (in descending order)
        sorted_contours = sorted(
            zip(contour_areas, contours), key=lambda x: x[0], reverse=True
        )
        # if there are more than 15 contours, it's likely that the cell is empty
        if len(sorted_contours) > 15:
            contours = []
        elif len(sorted_contours) > 4:
            # keep the 5 largest contours to reduce noise
            _, contours = zip(*sorted_contours[4:9])
        # Draw the filtered contours on a blank image
        cell = cv2.drawContours(
            np.zeros(cell.shape, np.uint8), contours, -1, (255, 255, 255), -1
        )
        # cell = cv2.GaussianBlur(cell, (3, 3), 0)
        kernel = np.ones((3, 3), np.uint8)
        cell = cv2.dilate(cell, kernel, iterations=1)
        # Use Tesseract to recognize the number
        config = "--psm 10 --oem 3 -c tessedit_char_whitelist=123456789"
        value = pytesseract.image_to_string(cell, config=config)
        cell_values.append(value.strip() if value.strip() else "0")

    print(f"recognized cell values: {np.array(cell_values).reshape(9, 9)}")

    return "".join(cell_values)

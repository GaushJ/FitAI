import { createRef } from "react";
import { render, screen, fireEvent, act } from "@testing-library/react-native";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { ScanLabelSheet } from "../ScanLabelSheet";

describe("ScanLabelSheet", () => {
  it("fires onTakePhoto and dismisses when Take Photo is pressed", async () => {
    const onTakePhoto = jest.fn();
    const ref = createRef<BottomSheetModal>();
    await render(<ScanLabelSheet ref={ref} onTakePhoto={onTakePhoto} onChooseLibrary={() => {}} />);
    await act(async () => {
      ref.current?.present();
    });

    expect(screen.getByText("Scan Nutrition Label")).toBeTruthy();

    await act(async () => {
      await fireEvent.press(screen.getByText("Take Photo"));
    });

    expect(onTakePhoto).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Scan Nutrition Label")).toBeNull();
  });

  it("fires onChooseLibrary when Choose from Library is pressed", async () => {
    const onChooseLibrary = jest.fn();
    const ref = createRef<BottomSheetModal>();
    await render(<ScanLabelSheet ref={ref} onTakePhoto={() => {}} onChooseLibrary={onChooseLibrary} />);
    await act(async () => {
      ref.current?.present();
    });

    await act(async () => {
      await fireEvent.press(screen.getByText("Choose from Library"));
    });

    expect(onChooseLibrary).toHaveBeenCalledTimes(1);
  });

  it("dismisses without firing either callback when Cancel is pressed", async () => {
    const onTakePhoto = jest.fn();
    const onChooseLibrary = jest.fn();
    const ref = createRef<BottomSheetModal>();
    await render(<ScanLabelSheet ref={ref} onTakePhoto={onTakePhoto} onChooseLibrary={onChooseLibrary} />);
    await act(async () => {
      ref.current?.present();
    });

    await act(async () => {
      await fireEvent.press(screen.getByText("Cancel"));
    });

    expect(onTakePhoto).not.toHaveBeenCalled();
    expect(onChooseLibrary).not.toHaveBeenCalled();
    expect(screen.queryByText("Scan Nutrition Label")).toBeNull();
  });
});

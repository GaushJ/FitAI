import { createRef } from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react-native";
import type { BottomSheetModal } from "@gorhom/bottom-sheet";
import { ApiKeysSheet } from "../ApiKeysSheet";
import { getApiKey, removeApiKey, setApiKey } from "@/lib/api/apiKeyStorage";

async function presentSheet() {
  const ref = createRef<BottomSheetModal>();
  await render(<ApiKeysSheet ref={ref} />);
  await act(async () => {
    ref.current?.present();
  });
  return ref;
}

describe("ApiKeysSheet", () => {
  afterEach(async () => {
    await removeApiKey("anthropic");
    await removeApiKey("groq");
  });

  it("flags Anthropic as required and Groq as optional when nothing is set", async () => {
    await presentSheet();

    expect(screen.getByText("Required")).toBeTruthy();
    expect(screen.getByText("Optional")).toBeTruthy();
  });

  it("shows an already-stored key as Set with a masked value", async () => {
    await setApiKey("groq", "gsk_demo1234567Qx2");
    await presentSheet();

    expect(await screen.findByText("gsk_de…7Qx2")).toBeTruthy();
    expect(screen.getByText("Set")).toBeTruthy();
    expect(screen.queryByText("gsk_demo1234567Qx2")).toBeNull();
  });

  it("saves a key for the selected provider and persists it", async () => {
    await presentSheet();

    await act(async () => {
      await fireEvent.changeText(screen.getByPlaceholderText("sk-ant-..."), "  sk-ant-abcdefghij  ");
    });
    await act(async () => {
      await fireEvent.press(screen.getByText("Save Key"));
    });

    await waitFor(() => expect(screen.getByText("Anthropic Claude key saved on this device.")).toBeTruthy());
    await expect(getApiKey("anthropic")).resolves.toBe("sk-ant-abcdefghij");
    expect(screen.getByText("Set")).toBeTruthy();
  });

  it("targets Groq after switching provider", async () => {
    await presentSheet();

    await act(async () => {
      // "Groq" is both a status-row label and a provider pill; the pill renders last.
      await fireEvent.press(screen.getAllByText("Groq").at(-1)!);
    });
    await act(async () => {
      await fireEvent.changeText(screen.getByPlaceholderText("gsk_..."), "gsk_abcdefghij");
    });
    await act(async () => {
      await fireEvent.press(screen.getByText("Save Key"));
    });

    await waitFor(() => expect(getApiKey("groq")).resolves.toBe("gsk_abcdefghij"));
    await expect(getApiKey("anthropic")).resolves.toBeNull();
  });

  it("removes a stored key", async () => {
    await setApiKey("anthropic", "sk-ant-abcdefghij");
    await presentSheet();

    await act(async () => {
      await fireEvent.press(await screen.findByLabelText("Remove Anthropic Claude key"));
    });

    await waitFor(() => expect(screen.getByText("Anthropic Claude key removed.")).toBeTruthy());
    await expect(getApiKey("anthropic")).resolves.toBeNull();
    expect(screen.getByText("Required")).toBeTruthy();
  });

  it("labels the button Update Key when the provider already has one", async () => {
    await setApiKey("anthropic", "sk-ant-abcdefghij");
    await presentSheet();

    expect(await screen.findByText("Update Key")).toBeTruthy();
  });
});

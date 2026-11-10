import { bodyDraftFrom, parseBodyDraft, type BodyDraft } from "../bodyProfile";

const valid: BodyDraft = {
  sex: "male",
  age: "30",
  height_cm: "180",
  weight_kg: "80",
  activity_level: "moderate",
  goal: "maintain",
};

describe("parseBodyDraft", () => {
  it("returns a numeric profile for a complete, in-range draft", () => {
    expect(parseBodyDraft(valid)).toEqual({
      sex: "male",
      age: 30,
      height_cm: 180,
      weight_kg: 80,
      activity_level: "moderate",
      goal: "maintain",
    });
  });

  it.each([
    ["sex", { sex: "" }],
    ["age", { age: "" }],
    ["height", { height_cm: "" }],
    ["weight", { weight_kg: "" }],
    ["activity level", { activity_level: "" }],
    ["goal", { goal: "" }],
  ] as const)("is null while %s is missing", (_label, change) => {
    expect(parseBodyDraft({ ...valid, ...change })).toBeNull();
  });

  it.each([{ age: "17" }, { age: "101" }, { height_cm: "119" }, { weight_kg: "29" }, { weight_kg: "abc" }])(
    "is null when out of range: %o",
    (change) => {
      expect(parseBodyDraft({ ...valid, ...change })).toBeNull();
    }
  );
});

describe("bodyDraftFrom", () => {
  it("turns a stored profile into form strings", () => {
    expect(
      bodyDraftFrom({ sex: "female", age: 25, height_cm: 165, weight_kg: 60.5, activity_level: "light", goal: "lose_weight" })
    ).toEqual({
      sex: "female",
      age: "25",
      height_cm: "165",
      weight_kg: "60.5",
      activity_level: "light",
      goal: "lose_weight",
    });
  });

  it("gives empty strings when nothing has been saved yet", () => {
    expect(bodyDraftFrom({ sex: null, age: null })).toEqual({
      sex: "",
      age: "",
      height_cm: "",
      weight_kg: "",
      activity_level: "",
      goal: "",
    });
  });
});

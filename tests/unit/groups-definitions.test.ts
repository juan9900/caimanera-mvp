import {
  CreateGroupSchema,
  RenameGroupSchema,
  GroupIdSchema,
  RemoveGroupMemberSchema,
  JoinGroupSchema,
  InviteGroupToMatchSchema,
} from "@/lib/groups/definitions";

const VALID_UUID = "b3c1f6c0-1c2a-4c3a-9b1e-000000000000";

describe("CreateGroupSchema", () => {
  it("accepts a valid name and trims it", () => {
    const result = CreateGroupSchema.safeParse({ name: "  Los del martes  " });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Los del martes");
    }
  });

  it("rejects a name shorter than 2 characters", () => {
    const result = CreateGroupSchema.safeParse({ name: "A" });

    expect(result.success).toBe(false);
  });

  it("rejects a name that is only whitespace", () => {
    const result = CreateGroupSchema.safeParse({ name: "   " });

    expect(result.success).toBe(false);
  });

  it("rejects a name longer than 40 characters", () => {
    const result = CreateGroupSchema.safeParse({ name: "a".repeat(41) });

    expect(result.success).toBe(false);
  });

  it("accepts a name at the 40 character boundary", () => {
    const result = CreateGroupSchema.safeParse({ name: "a".repeat(40) });

    expect(result.success).toBe(true);
  });
});

describe("RenameGroupSchema", () => {
  it("accepts a valid groupId and name", () => {
    const result = RenameGroupSchema.safeParse({ groupId: VALID_UUID, name: "Nuevo nombre" });

    expect(result.success).toBe(true);
  });

  it("rejects an invalid groupId", () => {
    const result = RenameGroupSchema.safeParse({ groupId: "not-a-uuid", name: "Nuevo nombre" });

    expect(result.success).toBe(false);
  });
});

describe("GroupIdSchema", () => {
  it("rejects a non-uuid groupId", () => {
    const result = GroupIdSchema.safeParse({ groupId: "abc" });

    expect(result.success).toBe(false);
  });
});

describe("RemoveGroupMemberSchema", () => {
  it("accepts two valid uuids", () => {
    const result = RemoveGroupMemberSchema.safeParse({
      groupId: VALID_UUID,
      userId: VALID_UUID,
    });

    expect(result.success).toBe(true);
  });

  it("rejects a missing userId", () => {
    const result = RemoveGroupMemberSchema.safeParse({ groupId: VALID_UUID, userId: "" });

    expect(result.success).toBe(false);
  });
});

describe("JoinGroupSchema", () => {
  it("accepts a uuid token", () => {
    const result = JoinGroupSchema.safeParse({ token: VALID_UUID });

    expect(result.success).toBe(true);
  });

  it("rejects a non-uuid token", () => {
    const result = JoinGroupSchema.safeParse({ token: "some-random-string" });

    expect(result.success).toBe(false);
  });
});

describe("InviteGroupToMatchSchema", () => {
  it("accepts two valid uuids", () => {
    const result = InviteGroupToMatchSchema.safeParse({
      matchId: VALID_UUID,
      groupId: VALID_UUID,
    });

    expect(result.success).toBe(true);
  });

  it("rejects an invalid matchId", () => {
    const result = InviteGroupToMatchSchema.safeParse({
      matchId: "not-a-uuid",
      groupId: VALID_UUID,
    });

    expect(result.success).toBe(false);
  });
});

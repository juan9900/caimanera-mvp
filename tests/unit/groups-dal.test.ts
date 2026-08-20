import {
  getMyGroups,
  getGroup,
  getGroupMemberIds,
  getMyGroupInvitations,
  getGroupPreviewByToken,
} from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(),
}));

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

/** A client with no authenticated user — every DAL read should short-circuit before touching `.from`. */
function unauthenticatedClient() {
  return {
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null } }) },
    from: jest.fn(),
  } as unknown as Awaited<ReturnType<typeof createClient>>;
}

describe("group reads without a session", () => {
  afterEach(() => jest.clearAllMocks());

  it("getMyGroups returns an empty list", async () => {
    const client = unauthenticatedClient();
    mockCreateClient.mockResolvedValue(client);

    await expect(getMyGroups()).resolves.toEqual([]);
    expect(client.from).not.toHaveBeenCalled();
  });

  it("getGroup returns null", async () => {
    mockCreateClient.mockResolvedValue(unauthenticatedClient());

    await expect(getGroup("g1")).resolves.toBeNull();
  });

  it("getGroupMemberIds returns an empty list", async () => {
    mockCreateClient.mockResolvedValue(unauthenticatedClient());

    await expect(getGroupMemberIds("g1")).resolves.toEqual([]);
  });

  it("getMyGroupInvitations returns an empty list", async () => {
    mockCreateClient.mockResolvedValue(unauthenticatedClient());

    await expect(getMyGroupInvitations()).resolves.toEqual([]);
  });

  it("getGroupPreviewByToken returns null", async () => {
    mockCreateClient.mockResolvedValue(unauthenticatedClient());

    await expect(getGroupPreviewByToken("token")).resolves.toBeNull();
  });
});

describe("getGroup", () => {
  afterEach(() => jest.clearAllMocks());

  it("splits members from pending invitees and drops rows whose user was deleted", async () => {
    const groupRow = { id: "g1", name: "Los del martes", owner_id: "user-1" };
    const memberRows = [
      { id: "m1", status: "miembro", user: { id: "user-1", name: "Juan", zone: null, created_at: "t" } },
      { id: "m2", status: "invitado", user: { id: "user-2", name: "Ana", zone: null, created_at: "t" } },
      { id: "m3", status: "invitado", user: null },
    ];

    const maybeSingle = jest.fn().mockResolvedValue({ data: groupRow });
    const groupsEq = jest.fn().mockReturnValue({ maybeSingle });
    const groupsSelect = jest.fn().mockReturnValue({ eq: groupsEq });

    const order = jest.fn().mockResolvedValue({ data: memberRows });
    const membersEq = jest.fn().mockReturnValue({ order });
    const membersSelect = jest.fn().mockReturnValue({ eq: membersEq });

    const from = jest.fn((table: string) => {
      if (table === "groups") return { select: groupsSelect };
      if (table === "group_members") return { select: membersSelect };
      throw new Error(`unexpected table ${table}`);
    });

    mockCreateClient.mockResolvedValue({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: "user-1", email: null } } }) },
      from,
    } as unknown as Awaited<ReturnType<typeof createClient>>);

    const detail = await getGroup("g1");

    expect(detail).not.toBeNull();
    expect(detail?.isOwner).toBe(true);
    expect(detail?.members).toEqual([
      { membershipId: "m1", status: "miembro", user: memberRows[0].user },
    ]);
    expect(detail?.invited).toEqual([
      { membershipId: "m2", status: "invitado", user: memberRows[1].user },
    ]);
  });

  it("returns null when the group doesn't exist or isn't visible (RLS)", async () => {
    const maybeSingle = jest.fn().mockResolvedValue({ data: null });
    const groupsEq = jest.fn().mockReturnValue({ maybeSingle });
    const groupsSelect = jest.fn().mockReturnValue({ eq: groupsEq });
    const from = jest.fn().mockReturnValue({ select: groupsSelect });

    mockCreateClient.mockResolvedValue({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: "user-1", email: null } } }) },
      from,
    } as unknown as Awaited<ReturnType<typeof createClient>>);

    await expect(getGroup("missing")).resolves.toBeNull();
  });
});

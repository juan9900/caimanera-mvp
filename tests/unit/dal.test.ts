import { verifySession, requireSession, getCurrentUserProfile } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(),
}));

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

function mockSupabaseClient({
  user,
  profile,
}: {
  user: { id: string; email: string | null } | null;
  profile?: unknown;
}) {
  const maybeSingle = jest.fn().mockResolvedValue({ data: profile ?? null });
  const eq = jest.fn().mockReturnValue({ maybeSingle });
  const select = jest.fn().mockReturnValue({ eq });
  const from = jest.fn().mockReturnValue({ select });

  return {
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user } }) },
    from,
  } as unknown as Awaited<ReturnType<typeof createClient>>;
}

describe("verifySession", () => {
  afterEach(() => jest.clearAllMocks());

  it("returns null when there is no authenticated user", async () => {
    mockCreateClient.mockResolvedValue(mockSupabaseClient({ user: null }));

    await expect(verifySession()).resolves.toBeNull();
  });

  it("returns the session when a user is authenticated", async () => {
    mockCreateClient.mockResolvedValue(
      mockSupabaseClient({ user: { id: "user-1", email: "juan@example.com" } })
    );

    await expect(verifySession()).resolves.toEqual({
      userId: "user-1",
      email: "juan@example.com",
    });
  });
});

describe("requireSession", () => {
  afterEach(() => jest.clearAllMocks());

  it("throws when there is no session", async () => {
    mockCreateClient.mockResolvedValue(mockSupabaseClient({ user: null }));

    await expect(requireSession()).rejects.toThrow("No autenticado");
  });

  it("resolves the session when authenticated", async () => {
    mockCreateClient.mockResolvedValue(
      mockSupabaseClient({ user: { id: "user-1", email: null } })
    );

    await expect(requireSession()).resolves.toEqual({
      userId: "user-1",
      email: null,
    });
  });
});

describe("getCurrentUserProfile", () => {
  afterEach(() => jest.clearAllMocks());

  it("returns null without querying the profile when unauthenticated", async () => {
    const client = mockSupabaseClient({ user: null });
    mockCreateClient.mockResolvedValue(client);

    await expect(getCurrentUserProfile()).resolves.toBeNull();
    expect(client.from).not.toHaveBeenCalled();
  });

  it("returns the profile row for the current user", async () => {
    const profile = { id: "user-1", name: "Juan", zone: "Maracaibo" };
    mockCreateClient.mockResolvedValue(
      mockSupabaseClient({ user: { id: "user-1", email: null }, profile })
    );

    await expect(getCurrentUserProfile()).resolves.toEqual(profile);
  });
});

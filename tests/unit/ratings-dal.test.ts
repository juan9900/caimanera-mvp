import { getMyRatingForCourt } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(),
}));

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

describe("getMyRatingForCourt", () => {
  afterEach(() => jest.clearAllMocks());

  it("returns null without touching the DB when there's no session", async () => {
    const from = jest.fn();
    mockCreateClient.mockResolvedValue({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null } }) },
      from,
    } as unknown as Awaited<ReturnType<typeof createClient>>);

    await expect(getMyRatingForCourt("court-1")).resolves.toBeNull();
    expect(from).not.toHaveBeenCalled();
  });

  it("returns null when the user hasn't rated the court", async () => {
    const maybeSingle = jest.fn().mockResolvedValue({ data: null });
    const eqUser = jest.fn().mockReturnValue({ maybeSingle });
    const eqCourt = jest.fn().mockReturnValue({ eq: eqUser });
    const select = jest.fn().mockReturnValue({ eq: eqCourt });
    const from = jest.fn().mockReturnValue({ select });

    mockCreateClient.mockResolvedValue({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: "user-1", email: null } } }) },
      from,
    } as unknown as Awaited<ReturnType<typeof createClient>>);

    await expect(getMyRatingForCourt("court-1")).resolves.toBeNull();
  });

  it("returns the user's existing rating", async () => {
    const maybeSingle = jest.fn().mockResolvedValue({ data: { rating: 4 } });
    const eqUser = jest.fn().mockReturnValue({ maybeSingle });
    const eqCourt = jest.fn().mockReturnValue({ eq: eqUser });
    const select = jest.fn().mockReturnValue({ eq: eqCourt });
    const from = jest.fn().mockReturnValue({ select });

    mockCreateClient.mockResolvedValue({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: "user-1", email: null } } }) },
      from,
    } as unknown as Awaited<ReturnType<typeof createClient>>);

    await expect(getMyRatingForCourt("court-1")).resolves.toBe(4);
  });
});

import webpush from "web-push";
import { getSubscriptionsForUsers, sendPushToSubscriptions } from "@/lib/push/send";
import { createAdminClient } from "@/lib/supabase/admin";

jest.mock("web-push", () => ({
  __esModule: true,
  default: { setVapidDetails: jest.fn(), sendNotification: jest.fn() },
}));

jest.mock("@/lib/supabase/admin", () => ({
  createAdminClient: jest.fn(),
}));

const sendNotification = webpush.sendNotification as jest.Mock;
const mockedCreateAdminClient = createAdminClient as jest.Mock;

/** Records what `.delete().in(...)` was called with. */
function stubAdminClient() {
  const inFilter = jest.fn().mockResolvedValue({ error: null });
  const del = jest.fn(() => ({ in: inFilter }));
  mockedCreateAdminClient.mockReturnValue({ from: jest.fn(() => ({ delete: del })) });
  return { inFilter };
}

const SUB_A = { endpoint: "https://push.example/a", p256dh: "pa", auth: "aa" };
const SUB_B = { endpoint: "https://push.example/b", p256dh: "pb", auth: "ab" };

const PAYLOAD = { title: "Caimanera", body: "Faltan 2 jugadores", url: "/partidos/1" };

describe("sendPushToSubscriptions", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    // Delivery failures are logged, not thrown; keep the expected noise out
    // of the test output.
    jest.spyOn(console, "warn").mockImplementation(() => {});
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_VAPID_PUBLIC_KEY: "public-key",
      VAPID_PRIVATE_KEY: "private-key",
      VAPID_SUBJECT: "mailto:test@caimanera.app",
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("sends the payload to every subscription", async () => {
    stubAdminClient();
    sendNotification.mockResolvedValue({});

    await sendPushToSubscriptions([SUB_A, SUB_B], PAYLOAD);

    expect(sendNotification).toHaveBeenCalledTimes(2);
    expect(sendNotification).toHaveBeenCalledWith(
      { endpoint: SUB_A.endpoint, keys: { p256dh: "pa", auth: "aa" } },
      JSON.stringify(PAYLOAD)
    );
  });

  it("deletes subscriptions the push service reports as gone (410)", async () => {
    const { inFilter } = stubAdminClient();
    sendNotification
      .mockRejectedValueOnce(Object.assign(new Error("gone"), { statusCode: 410 }))
      .mockResolvedValueOnce({});

    await sendPushToSubscriptions([SUB_A, SUB_B], PAYLOAD);

    expect(inFilter).toHaveBeenCalledWith("endpoint", [SUB_A.endpoint]);
  });

  it("keeps subscriptions that fail for other reasons", async () => {
    const { inFilter } = stubAdminClient();
    sendNotification.mockRejectedValue(
      Object.assign(new Error("boom"), { statusCode: 500 })
    );

    await expect(sendPushToSubscriptions([SUB_A], PAYLOAD)).resolves.toBeUndefined();
    expect(inFilter).not.toHaveBeenCalled();
  });

  it("never throws, so a failed push can't fail the action that triggered it", async () => {
    stubAdminClient();
    sendNotification.mockRejectedValue(new Error("network down"));

    await expect(sendPushToSubscriptions([SUB_A], PAYLOAD)).resolves.toBeUndefined();
  });

  it("does nothing when there are no subscriptions", async () => {
    stubAdminClient();

    await sendPushToSubscriptions([], PAYLOAD);

    expect(sendNotification).not.toHaveBeenCalled();
  });
});

describe("getSubscriptionsForUsers", () => {
  /** A client whose `.select().in()` resolves to the given rows. */
  function stubReader(rows: unknown[]) {
    const inFilter = jest.fn().mockResolvedValue({ data: rows, error: null });
    const select = jest.fn(() => ({ in: inFilter }));
    return { client: { from: jest.fn(() => ({ select })) }, inFilter };
  }

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("reads through the service-role client when it is configured", async () => {
    const admin = stubReader([SUB_A]);
    const session = stubReader([]);
    mockedCreateAdminClient.mockReturnValue(admin.client);

    const result = await getSubscriptionsForUsers(session.client as never, ["u1"]);

    expect(result).toEqual([SUB_A]);
    expect(admin.inFilter).toHaveBeenCalledWith("user_id", ["u1"]);
    expect(session.client.from).not.toHaveBeenCalled();
  });

  it("falls back to the caller's own client when the service-role key is missing", async () => {
    const session = stubReader([SUB_B]);
    mockedCreateAdminClient.mockReturnValue(null);

    const result = await getSubscriptionsForUsers(session.client as never, ["u1"]);

    expect(result).toEqual([SUB_B]);
    expect(session.inFilter).toHaveBeenCalledWith("user_id", ["u1"]);
  });

  it("dedupes user ids and skips the query when there are none", async () => {
    const session = stubReader([]);
    mockedCreateAdminClient.mockReturnValue(null);

    await getSubscriptionsForUsers(session.client as never, ["u1", "u1", ""]);
    expect(session.inFilter).toHaveBeenCalledWith("user_id", ["u1"]);

    jest.clearAllMocks();
    const empty = stubReader([]);
    await getSubscriptionsForUsers(empty.client as never, []);
    expect(empty.client.from).not.toHaveBeenCalled();
  });
});

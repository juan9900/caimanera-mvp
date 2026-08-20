import { notifyGroupInvited } from "@/lib/push/group-notifications";
import { notifyUsers } from "@/lib/push/send";

jest.mock("@/lib/push/send", () => ({
  notifyUsers: jest.fn(),
}));

const mockNotifyUsers = notifyUsers as jest.MockedFunction<typeof notifyUsers>;

describe("notifyGroupInvited", () => {
  afterEach(() => jest.clearAllMocks());

  it("notifies every invited user with the group name in the body and a relative url", async () => {
    const client = {} as never;

    await notifyGroupInvited(client, ["user-1", "user-2"], "Los del martes", "Juan");

    expect(mockNotifyUsers).toHaveBeenCalledWith(client, ["user-1", "user-2"], {
      title: "Te invitaron a un grupo",
      body: "Juan te invitó al grupo Los del martes.",
      url: "/invitaciones",
    });
  });

  it("falls back to a neutral inviter label when the name is unknown", async () => {
    const client = {} as never;

    await notifyGroupInvited(client, ["user-1"], "Los del martes", null);

    expect(mockNotifyUsers).toHaveBeenCalledWith(
      client,
      ["user-1"],
      expect.objectContaining({ body: "Un jugador te invitó al grupo Los del martes." })
    );
  });
});

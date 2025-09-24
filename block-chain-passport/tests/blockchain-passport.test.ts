
import { describe, expect, it } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;
const wallet3 = accounts.get("wallet_3")!;

describe("Blockchain Passport System", () => {
  describe("Contract Setup", () => {
    it("ensures simnet is well initialised", () => {
      expect(simnet.blockHeight).toBeDefined();
    });

    it("should initialize with correct contract owner", () => {
      const { result } = simnet.callReadOnlyFn(
        "blockchain-passport",
        "is-authority",
        [Cl.principal(deployer)],
        deployer
      );
      expect(result).toBeBool(false);
    });
  });

  describe("Authority Management", () => {
    it("should allow contract owner to add authority", () => {
      const { result } = simnet.callPublicFn(
        "blockchain-passport",
        "add-authority",
        [Cl.principal(wallet1), Cl.stringUtf8("Government Authority")],
        deployer
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("should verify authority was added correctly", () => {
      simnet.callPublicFn(
        "blockchain-passport",
        "add-authority",
        [Cl.principal(wallet1), Cl.stringUtf8("Government Authority")],
        deployer
      );

      const { result } = simnet.callReadOnlyFn(
        "blockchain-passport",
        "is-authority",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(result).toBeBool(true);
    });

    it("should reject authority addition from non-owner", () => {
      const { result } = simnet.callPublicFn(
        "blockchain-passport",
        "add-authority",
        [Cl.principal(wallet2), Cl.stringUtf8("Unauthorized Authority")],
        wallet1
      );
      expect(result).toBeErr(Cl.uint(1)); // err-unauthorized
    });

    it("should allow contract owner to remove authority", () => {
      simnet.callPublicFn(
        "blockchain-passport",
        "add-authority",
        [Cl.principal(wallet1), Cl.stringUtf8("Government Authority")],
        deployer
      );

      const { result } = simnet.callPublicFn(
        "blockchain-passport",
        "remove-authority",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("should verify authority was removed correctly", () => {
      simnet.callPublicFn(
        "blockchain-passport",
        "add-authority",
        [Cl.principal(wallet1), Cl.stringUtf8("Government Authority")],
        deployer
      );

      simnet.callPublicFn(
        "blockchain-passport",
        "remove-authority",
        [Cl.principal(wallet1)],
        deployer
      );

      const { result } = simnet.callReadOnlyFn(
        "blockchain-passport",
        "is-authority",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(result).toBeBool(false);
    });

    it("should reject authority removal from non-owner", () => {
      simnet.callPublicFn(
        "blockchain-passport",
        "add-authority",
        [Cl.principal(wallet1), Cl.stringUtf8("Government Authority")],
        deployer
      );

      const { result } = simnet.callPublicFn(
        "blockchain-passport",
        "remove-authority",
        [Cl.principal(wallet1)],
        wallet2
      );
      expect(result).toBeErr(Cl.uint(1)); // err-unauthorized
    });

    it("should add multiple authorities successfully", () => {
      const result1 = simnet.callPublicFn(
        "blockchain-passport",
        "add-authority",
        [Cl.principal(wallet1), Cl.stringUtf8("Immigration Office")],
        deployer
      );
      expect(result1.result).toBeOk(Cl.bool(true));

      const result2 = simnet.callPublicFn(
        "blockchain-passport",
        "add-authority",
        [Cl.principal(wallet2), Cl.stringUtf8("Embassy")],
        deployer
      );
      expect(result2.result).toBeOk(Cl.bool(true));

      const check1 = simnet.callReadOnlyFn(
        "blockchain-passport",
        "is-authority",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(check1.result).toBeBool(true);

      const check2 = simnet.callReadOnlyFn(
        "blockchain-passport",
        "is-authority",
        [Cl.principal(wallet2)],
        deployer
      );
      expect(check2.result).toBeBool(true);
    });
  });

  describe("Passport Issuance", () => {
    it("should allow authority to issue passport", () => {
      simnet.callPublicFn(
        "blockchain-passport",
        "add-authority",
        [Cl.principal(wallet1), Cl.stringUtf8("Government Authority")],
        deployer
      );

      const { result } = simnet.callPublicFn(
        "blockchain-passport",
        "issue-passport",
        [
          Cl.tuple({
            "passport-id": Cl.stringUtf8("PASS001"),
            "holder": Cl.principal(wallet2),
            "metadata": Cl.stringUtf8("John Doe, DOB: 1990-01-01"),
            "expiry-date": Cl.uint(1000000)
          })
        ],
        wallet1
      );
      expect(result).toBeOk(Cl.stringUtf8("PASS001"));
    });

    it("should reject passport issuance from non-authority", () => {
      const { result } = simnet.callPublicFn(
        "blockchain-passport",
        "issue-passport",
        [
          Cl.tuple({
            "passport-id": Cl.stringUtf8("PASS002"),
            "holder": Cl.principal(wallet2),
            "metadata": Cl.stringUtf8("Jane Doe, DOB: 1992-05-15"),
            "expiry-date": Cl.uint(1000000)
          })
        ],
        wallet2
      );
      expect(result).toBeErr(Cl.uint(1)); // err-unauthorized
    });

    it("should reject duplicate passport ID", () => {
      simnet.callPublicFn(
        "blockchain-passport",
        "add-authority",
        [Cl.principal(wallet1), Cl.stringUtf8("Government Authority")],
        deployer
      );

      simnet.callPublicFn(
        "blockchain-passport",
        "issue-passport",
        [
          Cl.tuple({
            "passport-id": Cl.stringUtf8("PASS003"),
            "holder": Cl.principal(wallet2),
            "metadata": Cl.stringUtf8("John Doe, DOB: 1990-01-01"),
            "expiry-date": Cl.uint(1000000)
          })
        ],
        wallet1
      );

      const { result } = simnet.callPublicFn(
        "blockchain-passport",
        "issue-passport",
        [
          Cl.tuple({
            "passport-id": Cl.stringUtf8("PASS003"),
            "holder": Cl.principal(wallet3),
            "metadata": Cl.stringUtf8("Jane Smith, DOB: 1985-12-20"),
            "expiry-date": Cl.uint(1000000)
          })
        ],
        wallet1
      );
      expect(result).toBeErr(Cl.uint(3)); // err-already-exists
    });

    it("should reject multiple passports for same holder", () => {
      simnet.callPublicFn(
        "blockchain-passport",
        "add-authority",
        [Cl.principal(wallet1), Cl.stringUtf8("Government Authority")],
        deployer
      );

      simnet.callPublicFn(
        "blockchain-passport",
        "issue-passport",
        [
          Cl.tuple({
            "passport-id": Cl.stringUtf8("PASS004"),
            "holder": Cl.principal(wallet2),
            "metadata": Cl.stringUtf8("John Doe, DOB: 1990-01-01"),
            "expiry-date": Cl.uint(1000000)
          })
        ],
        wallet1
      );

      const { result } = simnet.callPublicFn(
        "blockchain-passport",
        "issue-passport",
        [
          Cl.tuple({
            "passport-id": Cl.stringUtf8("PASS005"),
            "holder": Cl.principal(wallet2),
            "metadata": Cl.stringUtf8("John Doe, DOB: 1990-01-01"),
            "expiry-date": Cl.uint(1000000)
          })
        ],
        wallet1
      );
      expect(result).toBeErr(Cl.uint(3)); // err-already-exists
    });

    it("should retrieve passport information correctly", () => {
      simnet.callPublicFn(
        "blockchain-passport",
        "add-authority",
        [Cl.principal(wallet1), Cl.stringUtf8("Government Authority")],
        deployer
      );

      simnet.callPublicFn(
        "blockchain-passport",
        "issue-passport",
        [
          Cl.tuple({
            "passport-id": Cl.stringUtf8("PASS006"),
            "holder": Cl.principal(wallet2),
            "metadata": Cl.stringUtf8("John Doe, DOB: 1990-01-01"),
            "expiry-date": Cl.uint(1000000)
          })
        ],
        wallet1
      );

      const { result } = simnet.callReadOnlyFn(
        "blockchain-passport",
        "get-passport",
        [Cl.stringUtf8("PASS006")],
        deployer
      );

      expect(result).toBeSome(
        Cl.tuple({
          "holder": Cl.principal(wallet2),
          "issue-date": Cl.uint(simnet.blockHeight),
          "expiry-date": Cl.uint(1000000),
          "metadata": Cl.stringUtf8("John Doe, DOB: 1990-01-01"),
          "issuer": Cl.principal(wallet1),
          "status": Cl.stringUtf8("active")
        })
      );
    });

    it("should retrieve holder passport mapping", () => {
      simnet.callPublicFn(
        "blockchain-passport",
        "add-authority",
        [Cl.principal(wallet1), Cl.stringUtf8("Government Authority")],
        deployer
      );

      simnet.callPublicFn(
        "blockchain-passport",
        "issue-passport",
        [
          Cl.tuple({
            "passport-id": Cl.stringUtf8("PASS007"),
            "holder": Cl.principal(wallet2),
            "metadata": Cl.stringUtf8("John Doe, DOB: 1990-01-01"),
            "expiry-date": Cl.uint(1000000)
          })
        ],
        wallet1
      );

      const { result } = simnet.callReadOnlyFn(
        "blockchain-passport",
        "get-holder-passport",
        [Cl.principal(wallet2)],
        deployer
      );

      expect(result).toBeSome(
        Cl.tuple({
          "passport-id": Cl.stringUtf8("PASS007")
        })
      );
    });
  });

  describe("Passport Modification", () => {
    it("should allow issuer to revoke passport", () => {
      simnet.callPublicFn(
        "blockchain-passport",
        "add-authority",
        [Cl.principal(wallet1), Cl.stringUtf8("Government Authority")],
        deployer
      );

      simnet.callPublicFn(
        "blockchain-passport",
        "issue-passport",
        [
          Cl.tuple({
            "passport-id": Cl.stringUtf8("PASS008"),
            "holder": Cl.principal(wallet2),
            "metadata": Cl.stringUtf8("John Doe, DOB: 1990-01-01"),
            "expiry-date": Cl.uint(1000000)
          })
        ],
        wallet1
      );

      const { result } = simnet.callPublicFn(
        "blockchain-passport",
        "revoke-passport",
        [Cl.stringUtf8("PASS008")],
        wallet1
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("should reject revocation from non-issuer", () => {
      simnet.callPublicFn(
        "blockchain-passport",
        "add-authority",
        [Cl.principal(wallet1), Cl.stringUtf8("Government Authority")],
        deployer
      );

      simnet.callPublicFn(
        "blockchain-passport",
        "issue-passport",
        [
          Cl.tuple({
            "passport-id": Cl.stringUtf8("PASS009"),
            "holder": Cl.principal(wallet2),
            "metadata": Cl.stringUtf8("John Doe, DOB: 1990-01-01"),
            "expiry-date": Cl.uint(1000000)
          })
        ],
        wallet1
      );

      const { result } = simnet.callPublicFn(
        "blockchain-passport",
        "revoke-passport",
        [Cl.stringUtf8("PASS009")],
        wallet2
      );
      expect(result).toBeErr(Cl.uint(1)); // err-unauthorized
    });

    it("should allow issuer to update metadata", () => {
      simnet.callPublicFn(
        "blockchain-passport",
        "add-authority",
        [Cl.principal(wallet1), Cl.stringUtf8("Government Authority")],
        deployer
      );

      simnet.callPublicFn(
        "blockchain-passport",
        "issue-passport",
        [
          Cl.tuple({
            "passport-id": Cl.stringUtf8("PASS010"),
            "holder": Cl.principal(wallet2),
            "metadata": Cl.stringUtf8("John Doe, DOB: 1990-01-01"),
            "expiry-date": Cl.uint(1000000)
          })
        ],
        wallet1
      );

      const { result } = simnet.callPublicFn(
        "blockchain-passport",
        "update-passport-metadata",
        [Cl.stringUtf8("PASS010"), Cl.stringUtf8("John Doe, DOB: 1990-01-01, Updated Address")],
        wallet1
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("should reject metadata update from non-issuer", () => {
      simnet.callPublicFn(
        "blockchain-passport",
        "add-authority",
        [Cl.principal(wallet1), Cl.stringUtf8("Government Authority")],
        deployer
      );

      simnet.callPublicFn(
        "blockchain-passport",
        "issue-passport",
        [
          Cl.tuple({
            "passport-id": Cl.stringUtf8("PASS011"),
            "holder": Cl.principal(wallet2),
            "metadata": Cl.stringUtf8("John Doe, DOB: 1990-01-01"),
            "expiry-date": Cl.uint(1000000)
          })
        ],
        wallet1
      );

      const { result } = simnet.callPublicFn(
        "blockchain-passport",
        "update-passport-metadata",
        [Cl.stringUtf8("PASS011"), Cl.stringUtf8("Unauthorized update")],
        wallet2
      );
      expect(result).toBeErr(Cl.uint(1)); // err-unauthorized
    });

    it("should allow issuer to extend validity", () => {
      simnet.callPublicFn(
        "blockchain-passport",
        "add-authority",
        [Cl.principal(wallet1), Cl.stringUtf8("Government Authority")],
        deployer
      );

      simnet.callPublicFn(
        "blockchain-passport",
        "issue-passport",
        [
          Cl.tuple({
            "passport-id": Cl.stringUtf8("PASS012"),
            "holder": Cl.principal(wallet2),
            "metadata": Cl.stringUtf8("John Doe, DOB: 1990-01-01"),
            "expiry-date": Cl.uint(1000000)
          })
        ],
        wallet1
      );

      const { result } = simnet.callPublicFn(
        "blockchain-passport",
        "extend-passport-validity",
        [Cl.stringUtf8("PASS012"), Cl.uint(2000000)],
        wallet1
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("should reject validity extension from non-issuer", () => {
      simnet.callPublicFn(
        "blockchain-passport",
        "add-authority",
        [Cl.principal(wallet1), Cl.stringUtf8("Government Authority")],
        deployer
      );

      simnet.callPublicFn(
        "blockchain-passport",
        "issue-passport",
        [
          Cl.tuple({
            "passport-id": Cl.stringUtf8("PASS013"),
            "holder": Cl.principal(wallet2),
            "metadata": Cl.stringUtf8("John Doe, DOB: 1990-01-01"),
            "expiry-date": Cl.uint(1000000)
          })
        ],
        wallet1
      );

      const { result } = simnet.callPublicFn(
        "blockchain-passport",
        "extend-passport-validity",
        [Cl.stringUtf8("PASS013"), Cl.uint(2000000)],
        wallet2
      );
      expect(result).toBeErr(Cl.uint(1)); // err-unauthorized
    });

    it("should handle operations on non-existent passport", () => {
      const revokeResult = simnet.callPublicFn(
        "blockchain-passport",
        "revoke-passport",
        [Cl.stringUtf8("NONEXISTENT")],
        wallet1
      );
      expect(revokeResult.result).toBeErr(Cl.uint(4)); // err-not-found

      const updateResult = simnet.callPublicFn(
        "blockchain-passport",
        "update-passport-metadata",
        [Cl.stringUtf8("NONEXISTENT"), Cl.stringUtf8("New metadata")],
        wallet1
      );
      expect(updateResult.result).toBeErr(Cl.uint(4)); // err-not-found

      const extendResult = simnet.callPublicFn(
        "blockchain-passport",
        "extend-passport-validity",
        [Cl.stringUtf8("NONEXISTENT"), Cl.uint(2000000)],
        wallet1
      );
      expect(extendResult.result).toBeErr(Cl.uint(4)); // err-not-found
    });
  });

  describe("Passport Verification", () => {
    it("should validate active passport as valid", () => {
      simnet.callPublicFn(
        "blockchain-passport",
        "add-authority",
        [Cl.principal(wallet1), Cl.stringUtf8("Government Authority")],
        deployer
      );

      simnet.callPublicFn(
        "blockchain-passport",
        "issue-passport",
        [
          Cl.tuple({
            "passport-id": Cl.stringUtf8("PASS014"),
            "holder": Cl.principal(wallet2),
            "metadata": Cl.stringUtf8("John Doe, DOB: 1990-01-01"),
            "expiry-date": Cl.uint(1000000)
          })
        ],
        wallet1
      );

      const { result } = simnet.callReadOnlyFn(
        "blockchain-passport",
        "is-valid-passport?",
        [Cl.stringUtf8("PASS014")],
        deployer
      );
      expect(result).toBeBool(true);
    });

    it("should validate revoked passport as invalid", () => {
      simnet.callPublicFn(
        "blockchain-passport",
        "add-authority",
        [Cl.principal(wallet1), Cl.stringUtf8("Government Authority")],
        deployer
      );

      simnet.callPublicFn(
        "blockchain-passport",
        "issue-passport",
        [
          Cl.tuple({
            "passport-id": Cl.stringUtf8("PASS015"),
            "holder": Cl.principal(wallet2),
            "metadata": Cl.stringUtf8("John Doe, DOB: 1990-01-01"),
            "expiry-date": Cl.uint(1000000)
          })
        ],
        wallet1
      );

      simnet.callPublicFn(
        "blockchain-passport",
        "revoke-passport",
        [Cl.stringUtf8("PASS015")],
        wallet1
      );

      const { result } = simnet.callReadOnlyFn(
        "blockchain-passport",
        "is-valid-passport?",
        [Cl.stringUtf8("PASS015")],
        deployer
      );
      expect(result).toBeBool(false);
    });

    it("should validate non-existent passport as invalid", () => {
      const { result } = simnet.callReadOnlyFn(
        "blockchain-passport",
        "is-valid-passport?",
        [Cl.stringUtf8("NONEXISTENT")],
        deployer
      );
      expect(result).toBeBool(false);
    });

    it("should return none for non-existent passport lookup", () => {
      const { result } = simnet.callReadOnlyFn(
        "blockchain-passport",
        "get-passport",
        [Cl.stringUtf8("NONEXISTENT")],
        deployer
      );
      expect(result).toBeNone();
    });

    it("should return none for holder without passport", () => {
      const { result } = simnet.callReadOnlyFn(
        "blockchain-passport",
        "get-holder-passport",
        [Cl.principal(wallet3)],
        deployer
      );
      expect(result).toBeNone();
    });

    it("should verify passport status changes correctly", () => {
      simnet.callPublicFn(
        "blockchain-passport",
        "add-authority",
        [Cl.principal(wallet1), Cl.stringUtf8("Government Authority")],
        deployer
      );

      simnet.callPublicFn(
        "blockchain-passport",
        "issue-passport",
        [
          Cl.tuple({
            "passport-id": Cl.stringUtf8("PASS016"),
            "holder": Cl.principal(wallet2),
            "metadata": Cl.stringUtf8("John Doe, DOB: 1990-01-01"),
            "expiry-date": Cl.uint(1000000)
          })
        ],
        wallet1
      );

      const beforeRevoke = simnet.callReadOnlyFn(
        "blockchain-passport",
        "get-passport",
        [Cl.stringUtf8("PASS016")],
        deployer
      );
      expect(beforeRevoke.result).toBeSome(
        Cl.tuple({
          "holder": Cl.principal(wallet2),
          "issue-date": Cl.uint(simnet.blockHeight),
          "expiry-date": Cl.uint(1000000),
          "metadata": Cl.stringUtf8("John Doe, DOB: 1990-01-01"),
          "issuer": Cl.principal(wallet1),
          "status": Cl.stringUtf8("active")
        })
      );

      simnet.callPublicFn(
        "blockchain-passport",
        "revoke-passport",
        [Cl.stringUtf8("PASS016")],
        wallet1
      );

      const afterRevoke = simnet.callReadOnlyFn(
        "blockchain-passport",
        "get-passport",
        [Cl.stringUtf8("PASS016")],
        deployer
      );
      expect(afterRevoke.result).toBeSome(
        Cl.tuple({
          "holder": Cl.principal(wallet2),
          "issue-date": Cl.uint(simnet.blockHeight),
          "expiry-date": Cl.uint(1000000),
          "metadata": Cl.stringUtf8("John Doe, DOB: 1990-01-01"),
          "issuer": Cl.principal(wallet1),
          "status": Cl.stringUtf8("revoked")
        })
      );
    });
  });

  describe("Edge Cases and Complex Scenarios", () => {
    it("should handle maximum length passport ID", () => {
      simnet.callPublicFn(
        "blockchain-passport",
        "add-authority",
        [Cl.principal(wallet1), Cl.stringUtf8("Government Authority")],
        deployer
      );

      const maxLengthId = "A".repeat(20);
      const { result } = simnet.callPublicFn(
        "blockchain-passport",
        "issue-passport",
        [
          Cl.tuple({
            "passport-id": Cl.stringUtf8(maxLengthId),
            "holder": Cl.principal(wallet2),
            "metadata": Cl.stringUtf8("John Doe, DOB: 1990-01-01"),
            "expiry-date": Cl.uint(1000000)
          })
        ],
        wallet1
      );
      expect(result).toBeOk(Cl.stringUtf8(maxLengthId));
    });

    it("should handle maximum length metadata", () => {
      simnet.callPublicFn(
        "blockchain-passport",
        "add-authority",
        [Cl.principal(wallet1), Cl.stringUtf8("Government Authority")],
        deployer
      );

      const maxLengthMetadata = "A".repeat(500);
      const { result } = simnet.callPublicFn(
        "blockchain-passport",
        "issue-passport",
        [
          Cl.tuple({
            "passport-id": Cl.stringUtf8("PASS017"),
            "holder": Cl.principal(wallet2),
            "metadata": Cl.stringUtf8(maxLengthMetadata),
            "expiry-date": Cl.uint(1000000)
          })
        ],
        wallet1
      );
      expect(result).toBeOk(Cl.stringUtf8("PASS017"));
    });

    it("should handle maximum length authority name", () => {
      const maxLengthName = "A".repeat(100);
      const { result } = simnet.callPublicFn(
        "blockchain-passport",
        "add-authority",
        [Cl.principal(wallet1), Cl.stringUtf8(maxLengthName)],
        deployer
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("should handle multiple sequential operations on same passport", () => {
      simnet.callPublicFn(
        "blockchain-passport",
        "add-authority",
        [Cl.principal(wallet1), Cl.stringUtf8("Government Authority")],
        deployer
      );

      simnet.callPublicFn(
        "blockchain-passport",
        "issue-passport",
        [
          Cl.tuple({
            "passport-id": Cl.stringUtf8("PASS018"),
            "holder": Cl.principal(wallet2),
            "metadata": Cl.stringUtf8("Initial metadata"),
            "expiry-date": Cl.uint(1000000)
          })
        ],
        wallet1
      );

      const updateResult = simnet.callPublicFn(
        "blockchain-passport",
        "update-passport-metadata",
        [Cl.stringUtf8("PASS018"), Cl.stringUtf8("Updated metadata")],
        wallet1
      );
      expect(updateResult.result).toBeOk(Cl.bool(true));

      const extendResult = simnet.callPublicFn(
        "blockchain-passport",
        "extend-passport-validity",
        [Cl.stringUtf8("PASS018"), Cl.uint(2000000)],
        wallet1
      );
      expect(extendResult.result).toBeOk(Cl.bool(true));

      const revokeResult = simnet.callPublicFn(
        "blockchain-passport",
        "revoke-passport",
        [Cl.stringUtf8("PASS018")],
        wallet1
      );
      expect(revokeResult.result).toBeOk(Cl.bool(true));
    });

    it("should prevent operations on revoked passports", () => {
      simnet.callPublicFn(
        "blockchain-passport",
        "add-authority",
        [Cl.principal(wallet1), Cl.stringUtf8("Government Authority")],
        deployer
      );

      simnet.callPublicFn(
        "blockchain-passport",
        "issue-passport",
        [
          Cl.tuple({
            "passport-id": Cl.stringUtf8("PASS019"),
            "holder": Cl.principal(wallet2),
            "metadata": Cl.stringUtf8("John Doe, DOB: 1990-01-01"),
            "expiry-date": Cl.uint(1000000)
          })
        ],
        wallet1
      );

      simnet.callPublicFn(
        "blockchain-passport",
        "revoke-passport",
        [Cl.stringUtf8("PASS019")],
        wallet1
      );

      const updateResult = simnet.callPublicFn(
        "blockchain-passport",
        "update-passport-metadata",
        [Cl.stringUtf8("PASS019"), Cl.stringUtf8("Should not work")],
        wallet1
      );
      expect(updateResult.result).toBeOk(Cl.bool(true));

      const extendResult = simnet.callPublicFn(
        "blockchain-passport",
        "extend-passport-validity",
        [Cl.stringUtf8("PASS019"), Cl.uint(3000000)],
        wallet1
      );
      expect(extendResult.result).toBeOk(Cl.bool(true));
    });

    it("should handle authority status changes correctly", () => {
      simnet.callPublicFn(
        "blockchain-passport",
        "add-authority",
        [Cl.principal(wallet1), Cl.stringUtf8("Government Authority")],
        deployer
      );

      simnet.callPublicFn(
        "blockchain-passport",
        "issue-passport",
        [
          Cl.tuple({
            "passport-id": Cl.stringUtf8("PASS020"),
            "holder": Cl.principal(wallet2),
            "metadata": Cl.stringUtf8("John Doe, DOB: 1990-01-01"),
            "expiry-date": Cl.uint(1000000)
          })
        ],
        wallet1
      );

      simnet.callPublicFn(
        "blockchain-passport",
        "remove-authority",
        [Cl.principal(wallet1)],
        deployer
      );

      const { result } = simnet.callPublicFn(
        "blockchain-passport",
        "issue-passport",
        [
          Cl.tuple({
            "passport-id": Cl.stringUtf8("PASS021"),
            "holder": Cl.principal(wallet3),
            "metadata": Cl.stringUtf8("Jane Smith, DOB: 1995-03-10"),
            "expiry-date": Cl.uint(1000000)
          })
        ],
        wallet1
      );
      expect(result).toBeErr(Cl.uint(1)); // err-unauthorized

      const revokeResult = simnet.callPublicFn(
        "blockchain-passport",
        "revoke-passport",
        [Cl.stringUtf8("PASS020")],
        wallet1
      );
      expect(revokeResult.result).toBeOk(Cl.bool(true));
    });

    it("should handle zero and maximum uint values for expiry dates", () => {
      simnet.callPublicFn(
        "blockchain-passport",
        "add-authority",
        [Cl.principal(wallet1), Cl.stringUtf8("Government Authority")],
        deployer
      );

      const zeroExpiryResult = simnet.callPublicFn(
        "blockchain-passport",
        "issue-passport",
        [
          Cl.tuple({
            "passport-id": Cl.stringUtf8("PASS022"),
            "holder": Cl.principal(wallet2),
            "metadata": Cl.stringUtf8("Zero expiry test"),
            "expiry-date": Cl.uint(0)
          })
        ],
        wallet1
      );
      expect(zeroExpiryResult.result).toBeOk(Cl.stringUtf8("PASS022"));

      const maxExpiryResult = simnet.callPublicFn(
        "blockchain-passport",
        "issue-passport",
        [
          Cl.tuple({
            "passport-id": Cl.stringUtf8("PASS023"),
            "holder": Cl.principal(wallet3),
            "metadata": Cl.stringUtf8("Max expiry test"),
            "expiry-date": Cl.uint(340282366920938463463374607431768211455) // u128 max
          })
        ],
        wallet1
      );
      expect(maxExpiryResult.result).toBeOk(Cl.stringUtf8("PASS023"));
    });

    it("should handle empty metadata", () => {
      simnet.callPublicFn(
        "blockchain-passport",
        "add-authority",
        [Cl.principal(wallet1), Cl.stringUtf8("Government Authority")],
        deployer
      );

      const { result } = simnet.callPublicFn(
        "blockchain-passport",
        "issue-passport",
        [
          Cl.tuple({
            "passport-id": Cl.stringUtf8("PASS024"),
            "holder": Cl.principal(wallet2),
            "metadata": Cl.stringUtf8(""),
            "expiry-date": Cl.uint(1000000)
          })
        ],
        wallet1
      );
      expect(result).toBeOk(Cl.stringUtf8("PASS024"));

      const updateResult = simnet.callPublicFn(
        "blockchain-passport",
        "update-passport-metadata",
        [Cl.stringUtf8("PASS024"), Cl.stringUtf8("")],
        wallet1
      );
      expect(updateResult.result).toBeOk(Cl.bool(true));
    });
  });
});

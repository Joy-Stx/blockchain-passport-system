
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
});

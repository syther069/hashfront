import { test } from "node:test";
import assert from "node:assert/strict";
import { tapesendEndpoint } from "../src/snippets.ts";

test("tapesendEndpoint: uint32(0) | uint64(chain id) | container, as the live TapeSend hub's endpointOf", () => {
  // printed by DeployXLayer on a fork of X Layer mainnet: CONTAINER and ENDPOINT from hub.endpointOf(container)
  assert.equal(tapesendEndpoint("0xEF50AC12DF9f586A89bDc90A44bC84A693De17DC"), "0x0000000000000000000000c4ef50ac12df9f586a89bdc90a44bc84a693de17dc");
  assert.equal(tapesendEndpoint(" 0x5D96417d287f6F10979b63b80504926DE4CE92bA "), "0x0000000000000000000000c45d96417d287f6f10979b63b80504926de4ce92ba");
  assert.equal(tapesendEndpoint("0x5D96417d287f6F10979b63b80504926DE4CE92bA")!.length, 66);
});

test("tapesendEndpoint: anything that is not a 20-byte address, or a bad chain id, gives no id", () => {
  for (const bad of ["", "0x123", "5D96417d287f6F10979b63b80504926DE4CE92bA", "0xZZ96417d287f6F10979b63b80504926DE4CE92bA", "0x5D96417d287f6F10979b63b80504926DE4CE92bA00"]) {
    assert.equal(tapesendEndpoint(bad), undefined, bad);
  }
  assert.equal(tapesendEndpoint("0x5D96417d287f6F10979b63b80504926DE4CE92bA", 0), undefined);
});

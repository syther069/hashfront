import { concatHex, encodeAbiParameters, keccak256, type Hex } from "viem";

export interface ChunkLeafInput {
  path: string;
  contentType: string;
  fileSha256: Hex;
  index: number;
  chunkSha256: Hex;
}

const LEAF_PARAMS = [
  { type: "string" },
  { type: "string" },
  { type: "bytes32" },
  { type: "uint256" },
  { type: "bytes32" },
] as const;

/**
 * Leaf hash for one chunk. Must match `ReleaseGate.leaf(path, contentType, fileSha256, index, chunkSha256)`:
 *   keccak256(bytes.concat(keccak256(abi.encode(path, contentType, fileSha256, index, chunkSha256))))
 * Double hashing keeps leaves distinct from 64-byte internal nodes.
 */
export function leafHash(c: ChunkLeafInput): Hex {
  const inner = keccak256(
    encodeAbiParameters(LEAF_PARAMS, [c.path, c.contentType, c.fileSha256, BigInt(c.index), c.chunkSha256]),
  );
  return keccak256(inner);
}

/** Sorted-pair hash, identical to `ReleaseGate._verify` (abi.encode of two bytes32 == concatenation). */
export function hashPair(a: Hex, b: Hex): Hex {
  return BigInt(a) < BigInt(b) ? keccak256(concatHex([a, b])) : keccak256(concatHex([b, a]));
}

export interface MerkleTree {
  root: Hex;
  /** proofs[i] is the proof for leaves[i] */
  proofs: Hex[][];
}

/**
 * Builds a sorted-pair Merkle tree. An unpaired node at the end of a level is
 * carried up unchanged, so every proof is just the list of siblings that exist.
 */
export function buildTree(leaves: readonly Hex[]): MerkleTree {
  if (leaves.length === 0) throw new Error("cannot build a Merkle tree with no leaves");

  const proofs: Hex[][] = leaves.map(() => []);
  // position[i] = index of leaf i's ancestor in the current level
  let position = leaves.map((_, i) => i);
  let level: Hex[] = [...leaves];

  while (level.length > 1) {
    const next: Hex[] = [];
    for (let i = 0; i < level.length; i += 2) {
      const left = level[i] as Hex;
      const right = level[i + 1];
      next.push(right === undefined ? left : hashPair(left, right));
    }
    position = position.map((p, leafIndex) => {
      const sibling = p % 2 === 0 ? level[p + 1] : level[p - 1];
      if (sibling !== undefined) (proofs[leafIndex] as Hex[]).push(sibling);
      return Math.floor(p / 2);
    });
    level = next;
  }

  return { root: level[0] as Hex, proofs };
}

export function verifyProof(proof: readonly Hex[], root: Hex, leaf: Hex): boolean {
  let node = leaf;
  for (const sibling of proof) node = hashPair(node, sibling);
  return node.toLowerCase() === root.toLowerCase();
}

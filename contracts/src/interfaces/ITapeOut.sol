// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice TapeOut processor (circuit NFT contract), TAP-02 §6.
/// @dev Selectors verified against X Layer mainnet: eval(uint256,bytes) on processor
///      0x839bdD6fa7A66416A609A735e11DE5411B98574e returned the XOR truth table for circuit #1.
interface ITapeOutProcessor {
    function nextId() external view returns (uint256);
    function circuitInfo(uint256 id) external view returns (uint32 nIn, uint32 nOut, uint32 nState, uint32 gateCount);
    function netlist(uint256 id) external view returns (bytes memory);
    function eval(uint256 id, bytes calldata inputs) external view returns (bytes memory outputs);
    function ownerOf(uint256 id) external view returns (address);
    function safeTransferFrom(address from, address to, uint256 id) external;
}

/// @notice DeWEB site store, TAP-10 Appendix B.5. Writes are `onlyEditor` (holder or operator).
interface ISiteRegistry {
    function putFile(
        address container,
        string calldata path,
        string calldata contentType,
        bytes32 sha256Hash,
        bytes calldata data
    ) external;
    function appendChunk(address container, string calldata path, uint256 expectIndex, bytes calldata data) external;
    function removeFile(address container, string calldata path) external;
    function setFallback(address container, string calldata path) external;
    function setOperator(address container, address op, uint256 ttl) external;
    function fileInfo(address container, string calldata path)
        external
        view
        returns (uint32 size, string memory contentType, bytes32 sha256Hash, uint40 updatedAt, uint256 chunkCount);
    function fallbackPath(address container) external view returns (string memory);
    /// @dev Verified on X Layer mainnet against Lingxi's site (TAP-10 §7.1).
    function readRange(address container, string calldata path, uint256 offset, uint256 len)
        external
        view
        returns (bytes memory);
}

/// @notice Container opener (ERC-6551 accounts), TAP-10 Appendix B.2.
/// @dev `open` / `FEE` confirmed on X Layer: FEE() = 0.08 OKB (Nov 19, 2026).
interface IContainerOpener {
    function accountOf(address circuits, uint256 tokenId) external view returns (address);
    function isOpened(address circuits, uint256 tokenId) external view returns (bool);
    function open(address circuits, uint256 tokenId) external payable returns (address container);
    function FEE() external view returns (uint256);
}

/// @notice Processor factory. `deployFee()` was 1e7 wei on X Layer (Nov 19, 2026).
interface IProcessorFactory {
    function createCPU(
        string calldata name,
        string calldata symbol,
        string calldata story,
        uint256 transistorSupply,
        uint256 mintPrice
    ) external payable returns (address transistors, address circuits);
    function deployFee() external view returns (uint256);
    function cpuCount() external view returns (uint256);
    function cpuAt(uint256 index) external view returns (address);
}

/// @notice A processor's transistor token (ERC-1155 style). Id 0 = NAND, id 1 = LATCH.
/// @dev Cost of one mint call: amount * mintPrice() + protocolFee().
interface ITransistors {
    function mint(uint256 id, uint256 amount) external payable;
    function mintPrice() external view returns (uint256);
    function protocolFee() external view returns (uint256);
    function supplyCap() external view returns (uint256);
    function minted() external view returns (uint256);
    function balanceOf(address account, uint256 id) external view returns (uint256);
}

/// @notice Processor functions used for taping out (TAP-02 §6).
interface ITapeOutWriter {
    function tapeout(bytes calldata netlist, uint32 nIn, uint32 nOut) external payable returns (uint256 id);
    function TAPEOUT_FEE() external view returns (uint256);
    function transistors() external view returns (address);
}

/// @notice `.tape` name binding (TAP-10 Appendix B.6). monthlyFee() was 0 on X Layer (Nov 19, 2026).
interface IDomainBinding {
    function bind(string calldata name, address container, uint256 months) external payable;
    function monthlyFee() external view returns (uint256);
}

/// @notice DeWEB messaging hub (TapeSend, TAP-10), same address on every chain. Sending is gas only.
/// @dev Verified on X Layer mainnet Nov 19, 2026: proxy at 0xe61A9C7213a6Aa616C246a2B569e555B417b25ee, MAX_PAYLOAD() = 16000.
///      `send` requires msg.sender == ownerOf(tokenId) and an opened container; `to` is an endpoint id
///      uint32(0) | uint64(chainId) | address(container). Payload v2: "TS" 0x02, kind (0x00 public), content.
interface ITapeSendHub {
    function send(address circuits, uint256 tokenId, bytes32 to, bytes32 ref, bytes calldata payload)
        external
        returns (uint256 inboxIndex);
    function endpointOf(address container) external view returns (bytes32);
    function inboxCount(bytes32 to) external view returns (uint256);
}

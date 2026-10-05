// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";

/// @title ClassBadge
/// @notice An ERC-721 attendance badge with fully on-chain JSON and SVG metadata.
contract ClassBadge is ERC721, Ownable {
    using Strings for uint256;

    uint256 private _nextId;
    mapping(uint256 => string) private _studentName;

    error EmptyName();

    constructor(address initialOwner)
        ERC721("ClassBadge", "BADGE")
        Ownable(initialOwner)
    {}

    function mint(address to, string calldata studentName)
        external
        onlyOwner
        returns (uint256 tokenId)
    {
        if (bytes(studentName).length == 0) revert EmptyName();

        tokenId = _nextId++;
        _studentName[tokenId] = studentName;
        _safeMint(to, tokenId);
    }

    function totalMinted() external view returns (uint256) {
        return _nextId;
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override
        returns (string memory)
    {
        _requireOwned(tokenId);
        string memory student = _studentName[tokenId];

        string memory image = string(
            abi.encodePacked(
                "data:image/svg+xml;base64,",
                Base64.encode(bytes(_svg(student, tokenId)))
            )
        );

        bytes memory json = abi.encodePacked(
            '{"name":"Blockchain Class Badge #',
            tokenId.toString(),
            '","description":"On-chain proof of attendance for the Blockchain course. ',
            'Metadata and image live entirely on-chain (no IPFS, no server).",',
            '"attributes":[',
            '{"trait_type":"Student","value":"',
            student,
            '"},',
            '{"trait_type":"Course","value":"Blockchain Technology and Cryptocurrency"}',
            '],',
            '"image":"',
            image,
            '"}'
        );

        return string(
            abi.encodePacked(
                "data:application/json;base64,",
                Base64.encode(json)
            )
        );
    }

    function _svg(string memory student, uint256 tokenId)
        internal
        pure
        returns (string memory)
    {
        return string(
            abi.encodePacked(
                '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400">',
                '<rect width="400" height="400" fill="#12331E"/>',
                '<text x="200" y="120" fill="#CFE6D6" font-size="26" text-anchor="middle" font-family="sans-serif">Blockchain Class</text>',
                '<text x="200" y="210" fill="#FFFFFF" font-size="30" text-anchor="middle" font-family="sans-serif">',
                student,
                "</text>",
                '<text x="200" y="300" fill="#8FBF9F" font-size="22" text-anchor="middle" font-family="sans-serif">Badge #',
                tokenId.toString(),
                "</text></svg>"
            )
        );
    }
}

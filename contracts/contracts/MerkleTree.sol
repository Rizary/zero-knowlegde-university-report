// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

interface IPoseidonHasher {
    function poseidon(uint256[2] calldata inputs) external pure returns (uint256);
}

contract MerkleTree {
    // uint256 public constant FIELD_SIZE = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
    uint256 public constant ZERO_VALUE = 1937035142596246788172577232054709726386880441279550832067530347910661804397;
    uint256 public constant ROOT_HISTORY_SIZE = 100;

    IPoseidonHasher public immutable hasher;

    uint256 public levels;
    uint32 public immutable maxSize;

    uint32 public index = 0;
    mapping(uint256 => uint256) public levelHashes;
    mapping(uint256 => uint256) public roots;
    
    // Merkle Tree leaves
    uint256[] public leaves;

    constructor(uint256 _levels, address _hasher) {
        require(_levels > 0, "_levels should be greater than 0");
        require(_levels <= 32, "_levels should not be greater than 32");
        levels = _levels;
        hasher = IPoseidonHasher(_hasher);
        maxSize = uint32(2) ** levels;

        for (uint256 i = 0; i < _levels; i++) {
            levelHashes[i] = zeros(i);
        }
    }

    function insert(uint256 leaf) public returns (uint32) {
        require(index != maxSize, "Merkle tree is full");
        leaves.push(leaf);
        uint32 currentIndex = index;
        uint256 currentLevelHash = leaf;
        uint256 left;
        uint256 right;

        for (uint256 i = 0; i < levels; i++) {
            if (currentIndex % 2 == 0) {
                left = currentLevelHash;
                right = zeros(i);
                levelHashes[i] = currentLevelHash;
            } else {
                left = levelHashes[i];
                right = currentLevelHash;
            }

            currentLevelHash = hasher.poseidon([left, right]);
            currentIndex /= 2;
        }

        roots[index % ROOT_HISTORY_SIZE] = currentLevelHash;

        index++;
        return index - 1;
    }

    function isValidRoot(uint256 root) public view returns (bool) {
        if (root == 0) {
            return false;
        }

        uint256 currentIndex = index % ROOT_HISTORY_SIZE;
        uint256 i = currentIndex;
        do {
            if (roots[i] == root) {
                return true;
            }

            if (i == 0) {
                i = ROOT_HISTORY_SIZE;
            }
            i--;
        }
        while (i != currentIndex);

        return false;
    }
    
    // Returns the leaves of the Merkle tree
    function getLeaves() public view returns (uint256[] memory) {
        return leaves;
    }
    
    function getZero() public view returns (uint256) {
        return ZERO_VALUE;
    }

    /// @dev provides Zero (Empty) elements for a Poseidon MerkleTree. Up to 32 levels
  function zeros(uint256 i) public pure returns (uint256) {
    if (i == 0) return uint256(1937035142596246788172577232054709726386880441279550832067530347910661804397);
    else if (i == 1) return uint256(4348295723778897049141723261395973749337519426678293562199873122726395268196);
    else if (i == 2) return uint256(1474437571872600362997653457309362083542225835636491231066225083182790685626);
    else if (i == 3) return uint256(17356128880109910410829578576658280813021342328596370030988177779312720300058);
    else if (i == 4) return uint256(5504410863540897731925481173841928205021312791423509740534040833037539137403);
    else if (i == 5) return uint256(13222871036005797443318841549808604264260795681462451613675465940239985075612);
    else if (i == 6) return uint256(9074027953357684149145081157343337318100053288465939907352600943498831812529);
    else if (i == 7) return uint256(12132398823534373336607706925539101743139984249429641687299025873425171888715);
    else if (i == 8) return uint256(18738921098455615125164407048284664125804130133807777143574853809480763592023);
    else if (i == 9) return uint256(11870207860581929913239432407953051372018646858881514349037737640077725161056);
    else if (i == 10) return uint256(10613193615659504666470792694046913996720530900896482440294761747497184399296);
    else if (i == 11) return uint256(18047331201645388626269117599029836987675525108597859344537151254714159023848);
    else if (i == 12) return uint256(17595697050629758074329684326796472816532116129809592192846333071852777014222);
    else if (i == 13) return uint256(14457096504452237816209374597462837558928275099072758359249153678660842386941);
    else if (i == 14) return uint256(14146116639601760515314508520293323957092508547161941634024845666138030610278);
    else if (i == 15) return uint256(10346429940560043132407465441581361652250812491921107622761622214082838498417);
    else if (i == 16) return uint256(4884854425034452113216806539271506867843366025171698337463756501040408682113);
    else if (i == 17) return uint256(17724298576766665955968573458938862628780415000848995352897169101985411130350);
    else if (i == 18) return uint256(1784828036088944859274400063024930877867307787241653799382942816324959847218);
    else if (i == 19) return uint256(20485523565911227403800790337228358550159357383948164757551750593670334374711);
    else if (i == 20) return uint256(13074994625651430052393147656528738723385260034926369784919109263081416865052);
    else if (i == 21) return uint256(7315212321321997038030658427011120276818778306226869474588287864335228721591);
    else if (i == 22) return uint256(13580839547574277909982233105946677628840302562520466242877533546081758555946);
    else if (i == 23) return uint256(20064129397606479126735762548974283863473443247409448289563821570992869036754);
    else if (i == 24) return uint256(15878499350264963607835768746927073424852702282378153738758009536072159855276);
    else if (i == 25) return uint256(7289196546201486286158162071452135044267601991230728062546364140026268710547);
    else if (i == 26) return uint256(2610684005010579396118516451953749263465350714646707161563448998852600590092);
    else if (i == 27) return uint256(14057974980410360701577944543975444959350269639813508030541411947726439512304);
    else if (i == 28) return uint256(11340701702469309237915415046028498929062538549645277807684492044172830084449);
    else if (i == 29) return uint256(16582891545904109604235519939852016700143504896441959728829840298843299541690);
    else if (i == 30) return uint256(18751100403957047858479073090737095867570890686903749515819388305912520660997);
    else if (i == 31) return uint256(4760207603955942934768102785477725467569284081877549516891353408220303110903);
    else if (i == 32) return uint256(3360448814339854783208078392745473298377005756273155119300367896658384210738);
    else revert("Index out of bounds");
  }
}
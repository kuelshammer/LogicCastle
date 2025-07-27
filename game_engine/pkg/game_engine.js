let wasm;

const heap = new Array(128).fill(undefined);

heap.push(undefined, null, true, false);

function getObject(idx) { return heap[idx]; }

let heap_next = heap.length;

function addHeapObject(obj) {
    if (heap_next === heap.length) heap.push(heap.length + 1);
    const idx = heap_next;
    heap_next = heap[idx];

    heap[idx] = obj;
    return idx;
}

function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        wasm.__wbindgen_export_0(addHeapObject(e));
    }
}

const cachedTextDecoder = (typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-8', { ignoreBOM: true, fatal: true }) : { decode: () => { throw Error('TextDecoder not available') } } );

if (typeof TextDecoder !== 'undefined') { cachedTextDecoder.decode(); };

let cachedUint8ArrayMemory0 = null;

function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

function dropObject(idx) {
    if (idx < 132) return;
    heap[idx] = heap_next;
    heap_next = idx;
}

function takeObject(idx) {
    const ret = getObject(idx);
    dropObject(idx);
    return ret;
}

let WASM_VECTOR_LEN = 0;

const cachedTextEncoder = (typeof TextEncoder !== 'undefined' ? new TextEncoder('utf-8') : { encode: () => { throw Error('TextEncoder not available') } } );

const encodeString = (typeof cachedTextEncoder.encodeInto === 'function'
    ? function (arg, view) {
    return cachedTextEncoder.encodeInto(arg, view);
}
    : function (arg, view) {
    const buf = cachedTextEncoder.encode(arg);
    view.set(buf);
    return {
        read: arg.length,
        written: buf.length
    };
});

function passStringToWasm0(arg, malloc, realloc) {

    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length, 1) >>> 0;
        getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

    const mem = getUint8ArrayMemory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }

    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
        const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
        const ret = encodeString(arg, view);

        offset += ret.written;
        ptr = realloc(ptr, len, offset, 1) >>> 0;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

let cachedDataViewMemory0 = null;

function getDataViewMemory0() {
    if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer.detached === true || (cachedDataViewMemory0.buffer.detached === undefined && cachedDataViewMemory0.buffer !== wasm.memory.buffer)) {
        cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
    }
    return cachedDataViewMemory0;
}

function isLikeNone(x) {
    return x === undefined || x === null;
}

function getArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}

let cachedUint32ArrayMemory0 = null;

function getUint32ArrayMemory0() {
    if (cachedUint32ArrayMemory0 === null || cachedUint32ArrayMemory0.byteLength === 0) {
        cachedUint32ArrayMemory0 = new Uint32Array(wasm.memory.buffer);
    }
    return cachedUint32ArrayMemory0;
}

function getArrayU32FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint32ArrayMemory0().subarray(ptr / 4, ptr / 4 + len);
}
/**
 * Helper function to convert difficulty string to number
 * @param {string} difficulty
 * @returns {number}
 */
export function difficulty_to_number(difficulty) {
    const ptr0 = passStringToWasm0(difficulty, wasm.__wbindgen_export_2, wasm.__wbindgen_export_3);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.difficulty_to_number(ptr0, len0);
    return ret;
}

/**
 * Helper function to convert difficulty number to string
 * @param {number} difficulty
 * @returns {string}
 */
export function difficulty_to_string(difficulty) {
    let deferred1_0;
    let deferred1_1;
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        wasm.difficulty_to_string(retptr, difficulty);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        deferred1_0 = r0;
        deferred1_1 = r1;
        return getStringFromWasm0(r0, r1);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
        wasm.__wbindgen_export_1(deferred1_0, deferred1_1, 1);
    }
}

function _assertClass(instance, klass) {
    if (!(instance instanceof klass)) {
        throw new Error(`expected instance of ${klass.name}`);
    }
}

export function main() {
    wasm.main();
}

let cachedInt8ArrayMemory0 = null;

function getInt8ArrayMemory0() {
    if (cachedInt8ArrayMemory0 === null || cachedInt8ArrayMemory0.byteLength === 0) {
        cachedInt8ArrayMemory0 = new Int8Array(wasm.memory.buffer);
    }
    return cachedInt8ArrayMemory0;
}

function getArrayI8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getInt8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}

let cachedInt16ArrayMemory0 = null;

function getInt16ArrayMemory0() {
    if (cachedInt16ArrayMemory0 === null || cachedInt16ArrayMemory0.byteLength === 0) {
        cachedInt16ArrayMemory0 = new Int16Array(wasm.memory.buffer);
    }
    return cachedInt16ArrayMemory0;
}

function getArrayI16FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getInt16ArrayMemory0().subarray(ptr / 2, ptr / 2 + len);
}

function getArrayJsValueFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    const mem = getDataViewMemory0();
    const result = [];
    for (let i = ptr; i < ptr + 4 * len; i += 4) {
        result.push(takeObject(mem.getUint32(i, true)));
    }
    return result;
}
/**
 * AI Difficulty levels with variable Stage 4 strategies
 * All difficulties use Stage 1-3 (Win/Block/Safe), but differ in Stage 4
 * @enum {0 | 1 | 2}
 */
export const AIDifficulty = Object.freeze({
    Easy: 0, "0": "Easy",
    Medium: 1, "1": "Medium",
    Hard: 2, "2": "Hard",
});
/**
 * @enum {0 | 1 | 2 | 3 | 4 | 5}
 */
export const GameError = Object.freeze({
    OutOfBounds: 0, "0": "OutOfBounds",
    PositionOccupied: 1, "1": "PositionOccupied",
    GameAlreadyOver: 2, "2": "GameAlreadyOver",
    InvalidPlayer: 3, "3": "InvalidPlayer",
    BoardError: 4, "4": "BoardError",
    InvalidMove: 5, "5": "InvalidMove",
});
/**
 * Game phase enumeration for strategic evaluation
 * @enum {0 | 1 | 2}
 */
export const GamePhase = Object.freeze({
    Opening: 0, "0": "Opening",
    Middle: 1, "1": "Middle",
    Endgame: 2, "2": "Endgame",
});
/**
 * @enum {1 | 2 | 3 | 4}
 */
export const Player = Object.freeze({
    Yellow: 1, "1": "Yellow",
    Red: 2, "2": "Red",
    Black: 3, "3": "Black",
    White: 4, "4": "White",
});
/**
 * @enum {0 | 1 | 2 | 3 | 4}
 */
export const TrioDifficulty = Object.freeze({
    Impossible: 0, "0": "Impossible",
    Hard: 1, "1": "Hard",
    Medium: 2, "2": "Medium",
    Easy: 3, "3": "Easy",
    VeryEasy: 4, "4": "VeryEasy",
});
/**
 * Difficulty levels for board generation
 * @enum {1 | 2 | 3 | 4}
 */
export const TrioDifficultyNew = Object.freeze({
    Kinderfreundlich: 1, "1": "Kinderfreundlich",
    Vollspektrum: 2, "2": "Vollspektrum",
    Strategisch: 3, "3": "Strategisch",
    Analytisch: 4, "4": "Analytisch",
});
/**
 * @enum {0 | 1 | 2 | 3}
 */
export const TrioDistribution = Object.freeze({
    Balanced: 0, "0": "Balanced",
    Educational: 1, "1": "Educational",
    Challenging: 2, "2": "Challenging",
    Official: 3, "3": "Official",
});

const AiMoveFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_aimove_free(ptr >>> 0, 1));
/**
 * A struct to represent an AI move for wasm-bindgen.
 */
export class AiMove {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(AiMove.prototype);
        obj.__wbg_ptr = ptr;
        AiMoveFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        AiMoveFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_aimove_free(ptr, 0);
    }
    /**
     * @returns {number}
     */
    get row() {
        const ret = wasm.__wbg_get_aimove_row(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @param {number} arg0
     */
    set row(arg0) {
        wasm.__wbg_set_aimove_row(this.__wbg_ptr, arg0);
    }
    /**
     * @returns {number}
     */
    get col() {
        const ret = wasm.__wbg_get_aimove_col(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @param {number} arg0
     */
    set col(arg0) {
        wasm.__wbg_set_aimove_col(this.__wbg_ptr, arg0);
    }
}

const BoardFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_board_free(ptr >>> 0, 1));

export class Board {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Board.prototype);
        obj.__wbg_ptr = ptr;
        BoardFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        BoardFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_board_free(ptr, 0);
    }
    /**
     * @param {number} rows
     * @param {number} cols
     */
    constructor(rows, cols) {
        const ret = wasm.board_new(rows, cols);
        this.__wbg_ptr = ret >>> 0;
        BoardFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @returns {number}
     */
    get_rows() {
        const ret = wasm.board_get_rows(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    get_cols() {
        const ret = wasm.board_get_cols(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {Int8Array}
     */
    get_cells() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.board_get_cells(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var v1 = getArrayI8FromWasm0(r0, r1).slice();
            wasm.__wbindgen_export_1(r0, r1 * 1, 1);
            return v1;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * @param {number} row
     * @param {number} col
     * @returns {number}
     */
    get_cell(row, col) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.board_get_cell(retptr, this.__wbg_ptr, row, col);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return r0;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * @param {number} row
     * @param {number} col
     * @param {number} value
     */
    set_cell(row, col, value) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.board_set_cell(retptr, this.__wbg_ptr, row, col, value);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * @param {number} row
     * @param {number} col
     * @returns {boolean}
     */
    is_within_bounds(row, col) {
        const ret = wasm.board_is_within_bounds(this.__wbg_ptr, row, col);
        return ret !== 0;
    }
    /**
     * @returns {boolean}
     */
    is_full() {
        const ret = wasm.board_is_full(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Check if a column is full (Connect4) - memory efficient check
     * @param {number} col
     * @returns {boolean}
     */
    is_column_full(col) {
        const ret = wasm.board_is_column_full(this.__wbg_ptr, col);
        return ret !== 0;
    }
    /**
     * Get column height (Connect4) - essential for AI move generation
     * @param {number} col
     * @returns {number}
     */
    column_height(col) {
        const ret = wasm.board_column_height(this.__wbg_ptr, col);
        return ret >>> 0;
    }
    /**
     * Fast clone for AI simulations - reuses memory layout
     * @returns {Board}
     */
    fast_clone() {
        const ret = wasm.board_fast_clone(this.__wbg_ptr);
        return Board.__wrap(ret);
    }
    /**
     * Check if a specific column has available space (for Connect4)
     * @param {number} col
     * @returns {boolean}
     */
    is_column_available(col) {
        const ret = wasm.board_is_column_available(this.__wbg_ptr, col);
        return ret !== 0;
    }
    /**
     * Get the row where a piece would land in a column (for Connect4)
     * @param {number} col
     * @returns {number | undefined}
     */
    get_drop_row(col) {
        const ret = wasm.board_get_drop_row(this.__wbg_ptr, col);
        return ret === 0x100000001 ? undefined : ret;
    }
}

const Connect4AIFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_connect4ai_free(ptr >>> 0, 1));
/**
 * Connect4 AI implementation using Gemini's pattern-based evaluation
 * Implements the "Stratege" layer of the Three-Layer Architecture
 */
export class Connect4AI {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Connect4AI.prototype);
        obj.__wbg_ptr = ptr;
        Connect4AIFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        Connect4AIFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_connect4ai_free(ptr, 0);
    }
    constructor() {
        const ret = wasm.connect4ai_new();
        this.__wbg_ptr = ret >>> 0;
        Connect4AIFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Create AI with specific difficulty level
     * @param {AIDifficulty} difficulty
     * @returns {Connect4AI}
     */
    static with_difficulty(difficulty) {
        const ret = wasm.connect4ai_with_difficulty(difficulty);
        return Connect4AI.__wrap(ret);
    }
    /**
     * Set the AI player (default: Red)
     * @param {Player} player
     */
    set_ai_player(player) {
        wasm.connect4ai_set_ai_player(this.__wbg_ptr, player);
    }
    /**
     * Set search depth (higher = stronger but slower)
     * @param {number} depth
     */
    set_difficulty(depth) {
        wasm.connect4ai_set_difficulty(this.__wbg_ptr, depth);
    }
    /**
     * Set AI difficulty level (Easy/Medium/Hard)
     * This is the preferred way to set AI strength
     * @param {AIDifficulty} difficulty
     */
    set_difficulty_level(difficulty) {
        wasm.connect4ai_set_difficulty_level(this.__wbg_ptr, difficulty);
    }
    /**
     * Get current difficulty level
     * @returns {AIDifficulty}
     */
    get_difficulty_level() {
        const ret = wasm.connect4ai_get_difficulty_level(this.__wbg_ptr);
        return ret;
    }
    /**
     * Get the best move for the current position
     * @param {Connect4Game} game
     * @returns {number | undefined}
     */
    get_best_move(game) {
        _assertClass(game, Connect4Game);
        const ret = wasm.connect4ai_get_best_move(this.__wbg_ptr, game.__wbg_ptr);
        return ret === 0x100000001 ? undefined : ret;
    }
    /**
     * Get the best move for a specific player (bidirectional AI)
     * This allows the AI to predict moves for both players
     * Unlike get_best_move, this works regardless of whose turn it is
     * @param {Connect4Game} game
     * @param {Player} player
     * @returns {number | undefined}
     */
    get_best_move_for_player(game, player) {
        _assertClass(game, Connect4Game);
        const ret = wasm.connect4ai_get_best_move_for_player(this.__wbg_ptr, game.__wbg_ptr, player);
        return ret === 0x100000001 ? undefined : ret;
    }
    /**
     * Get the evaluation score for the current position
     * @param {Connect4Game} game
     * @returns {number}
     */
    evaluate_position(game) {
        _assertClass(game, Connect4Game);
        const ret = wasm.connect4ai_evaluate_position(this.__wbg_ptr, game.__wbg_ptr);
        return ret;
    }
    /**
     * Get a quick move for time-constrained situations
     * @param {Connect4Game} game
     * @returns {number | undefined}
     */
    get_quick_move(game) {
        _assertClass(game, Connect4Game);
        const ret = wasm.connect4ai_get_quick_move(this.__wbg_ptr, game.__wbg_ptr);
        return ret === 0x100000001 ? undefined : ret;
    }
}

const Connect4GameFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_connect4game_free(ptr >>> 0, 1));
/**
 * Connect4 game implementation using the Three-Layer Architecture
 * Composes geometry and data layers for clean separation of concerns
 */
export class Connect4Game {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Connect4Game.prototype);
        obj.__wbg_ptr = ptr;
        Connect4GameFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        Connect4GameFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_connect4game_free(ptr, 0);
    }
    constructor() {
        const ret = wasm.connect4game_new();
        this.__wbg_ptr = ret >>> 0;
        Connect4GameFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Create a new Connect4 game with a specific starting player
     * This is essential for game series where "loser starts next game"
     * @param {Player} starting_player
     * @returns {Connect4Game}
     */
    static new_with_starting_player(starting_player) {
        const ret = wasm.connect4game_new_with_starting_player(starting_player);
        return Connect4Game.__wrap(ret);
    }
    /**
     * Make a move in the specified column
     * @param {number} column
     * @returns {boolean}
     */
    make_move(column) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.connect4game_make_move(retptr, this.__wbg_ptr, column);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return r0 !== 0;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get cell value at position (0 = empty, 1 = yellow, 2 = red)
     * @param {number} row
     * @param {number} col
     * @returns {number}
     */
    get_cell(row, col) {
        const ret = wasm.connect4game_get_cell(this.__wbg_ptr, row, col);
        return ret;
    }
    /**
     * Get current player
     * @returns {Player}
     */
    current_player() {
        const ret = wasm.connect4game_current_player(this.__wbg_ptr);
        return ret;
    }
    /**
     * Get winner (if any)
     * @returns {Player | undefined}
     */
    winner() {
        const ret = wasm.connect4game_get_winner(this.__wbg_ptr);
        return ret === 0 ? undefined : ret;
    }
    /**
     * Get move count
     * @returns {number}
     */
    move_count() {
        const ret = wasm.connect4game_get_move_count(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Check if column is valid for next move
     * @param {number} column
     * @returns {boolean}
     */
    is_valid_move(column) {
        const ret = wasm.connect4game_is_valid_move(this.__wbg_ptr, column);
        return ret !== 0;
    }
    /**
     * Get column height
     * @param {number} column
     * @returns {number}
     */
    get_column_height(column) {
        const ret = wasm.connect4game_get_column_height(this.__wbg_ptr, column);
        return ret >>> 0;
    }
    /**
     * Reset game to initial state
     */
    reset() {
        wasm.connect4game_newGame(this.__wbg_ptr);
    }
    /**
     * Reset game with a specific starting player
     * @param {Player} starting_player
     */
    reset_with_starting_player(starting_player) {
        wasm.connect4game_reset_with_starting_player(this.__wbg_ptr, starting_player);
    }
    /**
     * Start a new game series with "loser starts" rule (legacy method)
     * If loser_starts is true, the losing player from the previous game starts the next game
     * @param {boolean} loser_starts
     */
    start_new_series(loser_starts) {
        wasm.connect4game_start_new_series(this.__wbg_ptr, loser_starts);
    }
    /**
     * Start a new game series with fixed player colors
     * Players keep their colors throughout the series, only start order changes
     * This is ideal for tournaments where Player A = always Yellow, Player B = always Red
     * @param {Player} player_a
     * @param {Player} player_b
     * @param {Player} winner
     */
    start_new_series_with_players(player_a, player_b, winner) {
        wasm.connect4game_start_new_series_with_players(this.__wbg_ptr, player_a, player_b, winner);
    }
    /**
     * Create a hypothetical game state for AI evaluation
     * This allows the AI to evaluate positions regardless of whose turn it is
     * @param {Player} hypothetical_player
     * @returns {Connect4Game}
     */
    create_hypothetical_state(hypothetical_player) {
        const ret = wasm.connect4game_create_hypothetical_state(this.__wbg_ptr, hypothetical_player);
        return Connect4Game.__wrap(ret);
    }
    /**
     * Get board state as string for debugging
     * @returns {string}
     */
    board_string() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.connect4game_board_string(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export_1(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Check if game is draw (board full, no winner)
     * @returns {boolean}
     */
    is_draw() {
        const ret = wasm.connect4game_is_draw(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Check if game is over (win or draw)
     * @returns {boolean}
     */
    is_game_over() {
        const ret = wasm.connect4game_is_game_over(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Get AI move suggestion using BULLETPROOF 4-stage hierarchical decision logic
     * ABSOLUTE PRIORITY: Own win > Block opponent > Strategic play
     * @returns {number | undefined}
     */
    get_ai_move() {
        const ret = wasm.connect4game_getAIMove(this.__wbg_ptr);
        return ret === 0x100000001 ? undefined : ret;
    }
    /**
     * Analyze current position comprehensively
     * @returns {PositionAnalysis}
     */
    analyze_position() {
        const ret = wasm.connect4game_analyze_position(this.__wbg_ptr);
        return PositionAnalysis.__wrap(ret);
    }
    /**
     * Get current game phase for AI strategy
     * @returns {GamePhase}
     */
    get_game_phase() {
        const ret = wasm.connect4game_get_game_phase(this.__wbg_ptr);
        return ret;
    }
    /**
     * Get memory usage of the game state (for performance monitoring)
     * @returns {number}
     */
    memory_usage() {
        const ret = wasm.connect4game_memory_usage(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Get current player (frontend naming convention)
     * @returns {Player}
     */
    get_current_player() {
        const ret = wasm.connect4game_current_player(this.__wbg_ptr);
        return ret;
    }
    /**
     * Set AI difficulty level
     * @param {AIDifficulty} difficulty
     */
    set_ai_difficulty(difficulty) {
        wasm.connect4game_set_ai_difficulty(this.__wbg_ptr, difficulty);
    }
    /**
     * Get current AI difficulty level
     * @returns {AIDifficulty}
     */
    get_ai_difficulty() {
        const ret = wasm.connect4game_get_ai_difficulty(this.__wbg_ptr);
        return ret;
    }
    /**
     * Get move count (frontend naming convention)
     * @returns {number}
     */
    get_move_count() {
        const ret = wasm.connect4game_get_move_count(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Get winner (frontend naming convention)
     * @returns {Player | undefined}
     */
    get_winner() {
        const ret = wasm.connect4game_get_winner(this.__wbg_ptr);
        return ret === 0 ? undefined : ret;
    }
    /**
     * Get board state as flat array for frontend (6 rows × 7 cols = 42 elements)
     * @returns {Uint8Array}
     */
    get_board() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.connect4game_get_board(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var v1 = getArrayU8FromWasm0(r0, r1).slice();
            wasm.__wbindgen_export_1(r0, r1 * 1, 1);
            return v1;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Check if undo is possible
     * @returns {boolean}
     */
    can_undo() {
        const ret = wasm.connect4game_can_undo(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Undo the last move
     * @returns {boolean}
     */
    undo_move() {
        const ret = wasm.connect4game_undo_move(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Get AI board representation (for assistance system)
     * @returns {Uint8Array}
     */
    get_ai_board() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.connect4game_get_ai_board(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var v1 = getArrayU8FromWasm0(r0, r1).slice();
            wasm.__wbindgen_export_1(r0, r1 * 1, 1);
            return v1;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get threatening moves for a player
     * @param {Player} player
     * @returns {Uint32Array}
     */
    get_threatening_moves(player) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.connect4game_get_threatening_moves(retptr, this.__wbg_ptr, player);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var v1 = getArrayU32FromWasm0(r0, r1).slice();
            wasm.__wbindgen_export_1(r0, r1 * 4, 4);
            return v1;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get winning moves for a player
     * @param {Player} player
     * @returns {Uint32Array}
     */
    get_winning_moves(player) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.connect4game_get_winning_moves(retptr, this.__wbg_ptr, player);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var v1 = getArrayU32FromWasm0(r0, r1).slice();
            wasm.__wbindgen_export_1(r0, r1 * 4, 4);
            return v1;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get blocking moves (moves that prevent opponent from winning)
     * @param {Player} player
     * @returns {Uint32Array}
     */
    get_blocking_moves(player) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.connect4game_get_blocking_moves(retptr, this.__wbg_ptr, player);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var v1 = getArrayU32FromWasm0(r0, r1).slice();
            wasm.__wbindgen_export_1(r0, r1 * 4, 4);
            return v1;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Evaluate position for a specific player
     * @param {Player} player
     * @returns {number}
     */
    evaluate_position_for_player(player) {
        const ret = wasm.connect4game_evaluate_position_for_player(this.__wbg_ptr, player);
        return ret;
    }
    /**
     * Frontend-friendly method aliases
     */
    newGame() {
        wasm.connect4game_newGame(this.__wbg_ptr);
    }
    /**
     * @returns {boolean}
     */
    undoMove() {
        const ret = wasm.connect4game_undoMove(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * @returns {number | undefined}
     */
    getAIMove() {
        const ret = wasm.connect4game_getAIMove(this.__wbg_ptr);
        return ret === 0x100000001 ? undefined : ret;
    }
}

const GameFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_game_free(ptr >>> 0, 1));

export class Game {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(Game.prototype);
        obj.__wbg_ptr = ptr;
        GameFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        GameFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_game_free(ptr, 0);
    }
    /**
     * @param {number} rows
     * @param {number} cols
     * @param {number} win_condition
     * @param {boolean} gravity_enabled
     */
    constructor(rows, cols, win_condition, gravity_enabled) {
        const ret = wasm.game_new(rows, cols, win_condition, gravity_enabled);
        this.__wbg_ptr = ret >>> 0;
        GameFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @param {number} col
     */
    make_move_connect4_js(col) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.game_make_move_connect4_js(retptr, this.__wbg_ptr, col);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * @param {number} row
     * @param {number} col
     */
    make_move_gobang_js(row, col) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.game_make_move_gobang_js(retptr, this.__wbg_ptr, row, col);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * @returns {Player | undefined}
     */
    check_win() {
        const ret = wasm.game_check_win(this.__wbg_ptr);
        return ret === 0 ? undefined : ret;
    }
    /**
     * @returns {boolean}
     */
    is_game_over() {
        const ret = wasm.game_is_game_over(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * @returns {Int8Array}
     */
    get_board() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.game_get_board(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var v1 = getArrayI8FromWasm0(r0, r1).slice();
            wasm.__wbindgen_export_1(r0, r1 * 1, 1);
            return v1;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * @returns {Player}
     */
    get_current_player() {
        const ret = wasm.game_get_current_player(this.__wbg_ptr);
        return ret;
    }
    /**
     * Get the starting player for this game
     * @returns {Player}
     */
    get_starting_player() {
        const ret = wasm.game_get_starting_player(this.__wbg_ptr);
        return ret;
    }
    /**
     * Set the starting player (for rotation logic)
     * @param {Player} player
     */
    set_starting_player(player) {
        wasm.game_set_starting_player(this.__wbg_ptr, player);
    }
    /**
     * Reset game to starting state with optional new starting player
     */
    reset_game() {
        wasm.game_reset_game(this.__wbg_ptr);
    }
    /**
     * Reset game with a specific starting player
     * @param {Player} starter
     */
    reset_game_with_starter(starter) {
        wasm.game_reset_game_with_starter(this.__wbg_ptr, starter);
    }
    /**
     * Fast clone for AI simulations - essential for minimax/MCTS
     * @returns {Game}
     */
    fast_clone() {
        const ret = wasm.game_fast_clone(this.__wbg_ptr);
        return Game.__wrap(ret);
    }
    /**
     * Get legal moves for Connect4 (WASM-friendly, memory efficient)
     * @returns {Uint32Array}
     */
    get_legal_moves_connect4() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.game_get_legal_moves_connect4(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var v1 = getArrayU32FromWasm0(r0, r1).slice();
            wasm.__wbindgen_export_1(r0, r1 * 4, 4);
            return v1;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Count legal moves efficiently (for quick AI evaluation)
     * @returns {number}
     */
    legal_move_count_connect4() {
        const ret = wasm.game_legal_move_count_connect4(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Simulate a move efficiently (for AI tree search)
     * @param {number} col
     * @returns {Game}
     */
    simulate_move_connect4(col) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.game_simulate_move_connect4(retptr, this.__wbg_ptr, col);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Game.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Simulate a move efficiently (WASM-compatible version)
     * @param {number} col
     * @returns {Game | undefined}
     */
    simulate_move_connect4_js(col) {
        const ret = wasm.game_simulate_move_connect4_js(this.__wbg_ptr, col);
        return ret === 0 ? undefined : Game.__wrap(ret);
    }
    /**
     * Check if game is in terminal state (win/draw)
     * @returns {boolean}
     */
    is_terminal() {
        const ret = wasm.game_is_game_over(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Advanced position evaluation with strategic scoring
     * Returns: +10000 for current player win, -10000 for opponent win, strategic score otherwise
     * @returns {number}
     */
    evaluate_position() {
        const ret = wasm.game_evaluate_position(this.__wbg_ptr);
        return ret;
    }
    /**
     * Simple evaluation for backward compatibility
     * @returns {number}
     */
    evaluate_position_simple() {
        const ret = wasm.game_evaluate_position_simple(this.__wbg_ptr);
        return ret;
    }
    /**
     * Advanced evaluation combining multiple strategic factors
     * @returns {number}
     */
    evaluate_position_advanced() {
        const ret = wasm.game_evaluate_position_advanced(this.__wbg_ptr);
        return ret;
    }
    /**
     * Count immediate threats for a player (winning moves available)
     * @param {Player} player
     * @returns {number}
     */
    count_threats(player) {
        const ret = wasm.game_count_threats(this.__wbg_ptr, player);
        return ret >>> 0;
    }
    /**
     * Get legal moves for Gobang (returns available positions as (row, col) tuples)
     * Returns a flattened vector where each pair of consecutive elements represents (row, col)
     * @returns {Uint32Array}
     */
    get_legal_moves_gobang() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.game_get_legal_moves_gobang(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var v1 = getArrayU32FromWasm0(r0, r1).slice();
            wasm.__wbindgen_export_1(r0, r1 * 4, 4);
            return v1;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Simulate a Gobang move without mutating the current game state
     * @param {number} row
     * @param {number} col
     * @returns {Game}
     */
    simulate_move_gobang(row, col) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.game_simulate_move_gobang(retptr, this.__wbg_ptr, row, col);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return Game.__wrap(r0);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get the winner if the game is over, None if it's a draw or ongoing
     * @returns {Player | undefined}
     */
    get_winner() {
        const ret = wasm.game_get_winner(this.__wbg_ptr);
        return ret === 0 ? undefined : ret;
    }
    /**
     * Get game phase as enum for external use
     * @returns {GamePhase}
     */
    get_game_phase() {
        const ret = wasm.game_get_game_phase(this.__wbg_ptr);
        return ret;
    }
    /**
     * Analyze position for threats and opportunities
     * @returns {PositionAnalysis}
     */
    analyze_position() {
        const ret = wasm.game_analyze_position(this.__wbg_ptr);
        return PositionAnalysis.__wrap(ret);
    }
    /**
     * Detect simple fork threats in bottom row: pattern _ x _ x _
     * Returns columns that must be played to prevent opponent fork
     * @param {Player} opponent
     * @returns {Uint32Array}
     */
    detect_bottom_row_forks(opponent) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.game_detect_bottom_row_forks(retptr, this.__wbg_ptr, opponent);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var v1 = getArrayU32FromWasm0(r0, r1).slice();
            wasm.__wbindgen_export_1(r0, r1 * 4, 4);
            return v1;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get fork-blocking moves for current player (prevent opponent forks)
     * @returns {Uint32Array}
     */
    get_fork_blocking_moves() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.game_get_fork_blocking_moves(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var v1 = getArrayU32FromWasm0(r0, r1).slice();
            wasm.__wbindgen_export_1(r0, r1 * 4, 4);
            return v1;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Check if opponent has dangerous fork patterns that require immediate attention
     * @returns {boolean}
     */
    has_critical_fork_threats() {
        const ret = wasm.game_has_critical_fork_threats(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Detect open three patterns: _ X X X _ (both sides open)
     * Returns flattened positions where placing a piece would create an open three
     * Each pair of consecutive elements represents (row, col)
     * @param {Player} player
     * @returns {Uint32Array}
     */
    detect_open_three(player) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.game_detect_open_three(retptr, this.__wbg_ptr, player);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var v1 = getArrayU32FromWasm0(r0, r1).slice();
            wasm.__wbindgen_export_1(r0, r1 * 4, 4);
            return v1;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Detect closed four patterns: O X X X X _ or _ X X X X O (one side blocked)
     * Returns flattened positions where placing a piece would create a closed four
     * Each pair of consecutive elements represents (row, col)
     * @param {Player} player
     * @returns {Uint32Array}
     */
    detect_closed_four(player) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.game_detect_closed_four(retptr, this.__wbg_ptr, player);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var v1 = getArrayU32FromWasm0(r0, r1).slice();
            wasm.__wbindgen_export_1(r0, r1 * 4, 4);
            return v1;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Detect double three fork patterns (two open threes intersecting)
     * Returns flattened positions that would create a double three fork
     * Each pair of consecutive elements represents (row, col)
     * @param {Player} player
     * @returns {Uint32Array}
     */
    detect_double_three_forks(player) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.game_detect_double_three_forks(retptr, this.__wbg_ptr, player);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var v1 = getArrayU32FromWasm0(r0, r1).slice();
            wasm.__wbindgen_export_1(r0, r1 * 4, 4);
            return v1;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get threat level (0-5) for a potential move
     * 5 = Immediate win, 4 = Must block, 3 = Strong threat, 2 = Medium, 1 = Weak, 0 = None
     * @param {number} row
     * @param {number} col
     * @param {Player} player
     * @returns {number}
     */
    get_threat_level(row, col, player) {
        const ret = wasm.game_get_threat_level(this.__wbg_ptr, row, col, player);
        return ret;
    }
    /**
     * Get dangerous moves for Gobang (moves that give opponent opportunities)
     * Returns flattened positions - each pair represents (row, col)
     * @returns {Uint32Array}
     */
    get_dangerous_moves_gobang() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.game_get_dangerous_moves_gobang(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var v1 = getArrayU32FromWasm0(r0, r1).slice();
            wasm.__wbindgen_export_1(r0, r1 * 4, 4);
            return v1;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get winning moves for Gobang (immediate 5-in-a-row)
     * Returns flattened positions - each pair represents (row, col)
     * @returns {Uint32Array}
     */
    get_winning_moves_gobang() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.game_get_winning_moves_gobang(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var v1 = getArrayU32FromWasm0(r0, r1).slice();
            wasm.__wbindgen_export_1(r0, r1 * 4, 4);
            return v1;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get blocking moves for Gobang (block opponent wins)
     * Returns flattened positions - each pair represents (row, col)
     * @returns {Uint32Array}
     */
    get_blocking_moves_gobang() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.game_get_blocking_moves_gobang(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var v1 = getArrayU32FromWasm0(r0, r1).slice();
            wasm.__wbindgen_export_1(r0, r1 * 4, 4);
            return v1;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
}

const GomokuGameFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_gomokugame_free(ptr >>> 0, 1));
/**
 * Gomoku/Gobang game implementation using the Three-Layer Architecture
 * Composes geometry and data layers for clean separation of concerns
 */
export class GomokuGame {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(GomokuGame.prototype);
        obj.__wbg_ptr = ptr;
        GomokuGameFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        GomokuGameFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_gomokugame_free(ptr, 0);
    }
    constructor() {
        const ret = wasm.gomokugame_new();
        this.__wbg_ptr = ret >>> 0;
        GomokuGameFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Create a new Gomoku game with a specific starting player
     * This is essential for game series where "loser starts next game"
     * @param {Player} starting_player
     * @returns {GomokuGame}
     */
    static new_with_starting_player(starting_player) {
        const ret = wasm.gomokugame_new_with_starting_player(starting_player);
        return GomokuGame.__wrap(ret);
    }
    /**
     * Make a move at the specified position (row, col)
     * Gomoku allows free placement anywhere on the board
     * @param {number} row
     * @param {number} col
     * @returns {boolean}
     */
    make_move(row, col) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.gomokugame_make_move(retptr, this.__wbg_ptr, row, col);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var r2 = getDataViewMemory0().getInt32(retptr + 4 * 2, true);
            if (r2) {
                throw takeObject(r1);
            }
            return r0 !== 0;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get cell value at position (0 = empty, 1 = black, 2 = white)
     * @param {number} row
     * @param {number} col
     * @returns {number}
     */
    get_cell(row, col) {
        const ret = wasm.gomokugame_get_cell(this.__wbg_ptr, row, col);
        return ret;
    }
    /**
     * Get current player
     * @returns {Player}
     */
    current_player() {
        const ret = wasm.gomokugame_current_player(this.__wbg_ptr);
        return ret;
    }
    /**
     * Get winner (if any)
     * @returns {Player | undefined}
     */
    winner() {
        const ret = wasm.gomokugame_winner(this.__wbg_ptr);
        return ret === 0 ? undefined : ret;
    }
    /**
     * Get move count
     * @returns {number}
     */
    move_count() {
        const ret = wasm.gomokugame_move_count(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Check if position is valid for next move
     * @param {number} row
     * @param {number} col
     * @returns {boolean}
     */
    is_valid_move(row, col) {
        const ret = wasm.gomokugame_is_valid_move(this.__wbg_ptr, row, col);
        return ret !== 0;
    }
    /**
     * Reset game to initial state
     */
    reset() {
        wasm.gomokugame_newGame(this.__wbg_ptr);
    }
    /**
     * Reset game with a specific starting player
     * @param {Player} starting_player
     */
    reset_with_starting_player(starting_player) {
        wasm.gomokugame_reset_with_starting_player(this.__wbg_ptr, starting_player);
    }
    /**
     * Start a new game series with "loser starts" rule (legacy method)
     * If loser_starts is true, the losing player from the previous game starts the next game
     * @param {boolean} loser_starts
     */
    start_new_series(loser_starts) {
        wasm.gomokugame_start_new_series(this.__wbg_ptr, loser_starts);
    }
    /**
     * Start a new game series with fixed player colors
     * Players keep their colors throughout the series, only start order changes
     * This is ideal for tournaments where Player A = always Black, Player B = always White
     * @param {Player} player_a
     * @param {Player} player_b
     * @param {Player} winner
     */
    start_new_series_with_players(player_a, player_b, winner) {
        wasm.gomokugame_start_new_series_with_players(this.__wbg_ptr, player_a, player_b, winner);
    }
    /**
     * Get board state as string for debugging
     * @returns {string}
     */
    board_string() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.gomokugame_board_string(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export_1(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Check if game is draw (board full, no winner)
     * @returns {boolean}
     */
    is_draw() {
        const ret = wasm.gomokugame_is_draw(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Check if game is over (win or draw)
     * @returns {boolean}
     */
    is_game_over() {
        const ret = wasm.gomokugame_is_game_over(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Get current game phase for AI strategy
     * @returns {GamePhase}
     */
    get_game_phase() {
        const ret = wasm.gomokugame_get_game_phase(this.__wbg_ptr);
        return ret;
    }
    /**
     * Get memory usage of the game state (for performance monitoring)
     * @returns {number}
     */
    memory_usage() {
        const ret = wasm.gomokugame_memory_usage(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Get current player (frontend naming convention)
     * @returns {Player}
     */
    get_current_player() {
        const ret = wasm.gomokugame_get_current_player(this.__wbg_ptr);
        return ret;
    }
    /**
     * Get move count (frontend naming convention)
     * @returns {number}
     */
    get_move_count() {
        const ret = wasm.gomokugame_get_move_count(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Get winner (frontend naming convention)
     * @returns {Player | undefined}
     */
    get_winner() {
        const ret = wasm.gomokugame_get_winner(this.__wbg_ptr);
        return ret === 0 ? undefined : ret;
    }
    /**
     * Get board state as flat array for frontend (15 rows × 15 cols = 225 elements)
     * @returns {Uint8Array}
     */
    get_board() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.gomokugame_get_board(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var v1 = getArrayU8FromWasm0(r0, r1).slice();
            wasm.__wbindgen_export_1(r0, r1 * 1, 1);
            return v1;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Check if undo is possible
     * @returns {boolean}
     */
    can_undo() {
        const ret = wasm.gomokugame_can_undo(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Undo the last move
     * @returns {boolean}
     */
    undo_move() {
        const ret = wasm.gomokugame_undo_move(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Frontend-friendly method aliases
     */
    newGame() {
        wasm.gomokugame_newGame(this.__wbg_ptr);
    }
    /**
     * @returns {boolean}
     */
    undoMove() {
        const ret = wasm.gomokugame_undoMove(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Get AI move suggestion (modern API with Option return type)
     * @returns {Uint32Array}
     */
    get_ai_move() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.gomokugame_get_ai_move(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var v1 = getArrayU32FromWasm0(r0, r1).slice();
            wasm.__wbindgen_export_1(r0, r1 * 4, 4);
            return v1;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get AI move suggestion (internal API with proper Option type)
     * @returns {AiMove | undefined}
     */
    get_ai_move_option() {
        const ret = wasm.gomokugame_get_ai_move_option(this.__wbg_ptr);
        return ret === 0 ? undefined : AiMove.__wrap(ret);
    }
    /**
     * Get AI move suggestion for specific player
     * @param {Player} player
     * @returns {Uint32Array}
     */
    get_ai_move_for_player(player) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.gomokugame_get_ai_move_for_player(retptr, this.__wbg_ptr, player);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var v1 = getArrayU32FromWasm0(r0, r1).slice();
            wasm.__wbindgen_export_1(r0, r1 * 4, 4);
            return v1;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Evaluate position for current player
     * @returns {number}
     */
    evaluate_position() {
        const ret = wasm.gomokugame_evaluate_position(this.__wbg_ptr);
        return ret;
    }
    /**
     * Evaluate position for specific player
     * @param {Player} player
     * @returns {number}
     */
    evaluate_position_for_player(player) {
        const ret = wasm.gomokugame_evaluate_position_for_player(this.__wbg_ptr, player);
        return ret;
    }
    /**
     * Get threat level for a position and player
     * @param {number} row
     * @param {number} col
     * @param {Player} player
     * @returns {number}
     */
    get_threat_level(row, col, player) {
        const ret = wasm.gomokugame_get_threat_level(this.__wbg_ptr, row, col, player);
        return ret;
    }
    /**
     * Get winning moves for current player
     * @returns {Uint32Array}
     */
    get_winning_moves() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.gomokugame_get_winning_moves(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var v1 = getArrayU32FromWasm0(r0, r1).slice();
            wasm.__wbindgen_export_1(r0, r1 * 4, 4);
            return v1;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get blocking moves (prevent opponent from winning)
     * @returns {Uint32Array}
     */
    get_blocking_moves() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.gomokugame_get_blocking_moves(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var v1 = getArrayU32FromWasm0(r0, r1).slice();
            wasm.__wbindgen_export_1(r0, r1 * 4, 4);
            return v1;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Analyze position (Connect4-compatible API)
     * @returns {string}
     */
    analyze_position() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.gomokugame_analyze_position(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export_1(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Get threatening moves for current player
     * @returns {Uint32Array}
     */
    get_threatening_moves() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.gomokugame_get_threatening_moves(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var v1 = getArrayU32FromWasm0(r0, r1).slice();
            wasm.__wbindgen_export_1(r0, r1 * 4, 4);
            return v1;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Create hypothetical state for AI evaluation
     * @param {Player} hypothetical_player
     * @returns {GomokuGame | undefined}
     */
    create_hypothetical_state(hypothetical_player) {
        const ret = wasm.gomokugame_create_hypothetical_state(this.__wbg_ptr, hypothetical_player);
        return ret === 0 ? undefined : GomokuGame.__wrap(ret);
    }
}

const LGameFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_lgame_free(ptr >>> 0, 1));
/**
 * L-Game implementation using the Three-Layer Architecture
 * Composes geometry and data layers for clean separation of concerns
 */
export class LGame {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(LGame.prototype);
        obj.__wbg_ptr = ptr;
        LGameFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        LGameFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_lgame_free(ptr, 0);
    }
    /**
     * Create new L-Game with initial setup
     */
    constructor() {
        const ret = wasm.lgame_new();
        this.__wbg_ptr = ret >>> 0;
        LGameFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Create a new L-Game with a specific starting player
     * This is essential for game series where "loser starts next game"
     * @param {Player} starting_player
     * @returns {LGame}
     */
    static new_with_starting_player(starting_player) {
        const ret = wasm.lgame_new_with_starting_player(starting_player);
        return LGame.__wrap(ret);
    }
    /**
     * Get current player
     * @returns {Player}
     */
    get current_player() {
        const ret = wasm.lgame_current_player(this.__wbg_ptr);
        return ret;
    }
    /**
     * Get move count
     * @returns {number}
     */
    get move_count() {
        const ret = wasm.lgame_move_count(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Check if game is over
     * @returns {boolean}
     */
    get game_over() {
        const ret = wasm.lgame_game_over(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Get winner (if any)
     * @returns {Player | undefined}
     */
    get winner() {
        const ret = wasm.lgame_winner(this.__wbg_ptr);
        return ret === 0 ? undefined : ret;
    }
    /**
     * Get cell value at position (for JavaScript interface)
     * Returns: 0=empty, 1=player1, 2=player2, 3=neutral
     * @param {number} row
     * @param {number} col
     * @returns {number}
     */
    get_cell(row, col) {
        const ret = wasm.lgame_get_cell(this.__wbg_ptr, row, col);
        return ret;
    }
    /**
     * Get complete board state as flat array (for JavaScript)
     * @returns {Uint8Array}
     */
    get_board_state() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.lgame_get_board_state(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var v1 = getArrayU8FromWasm0(r0, r1).slice();
            wasm.__wbindgen_export_1(r0, r1 * 1, 1);
            return v1;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get valid moves count (for JavaScript interface)
     * @returns {number}
     */
    get_valid_moves_count() {
        const ret = wasm.lgame_get_valid_moves_count(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Check if current player is blocked (cannot move L-piece)
     * @returns {boolean}
     */
    is_current_player_blocked() {
        const ret = wasm.lgame_is_current_player_blocked(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Make a move (L-piece move is mandatory, neutral move is optional)
     * @param {number} l_to_row
     * @param {number} l_to_col
     * @param {number} l_to_orientation
     */
    make_move(l_to_row, l_to_col, l_to_orientation) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.lgame_make_move(retptr, this.__wbg_ptr, l_to_row, l_to_col, l_to_orientation);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Move neutral piece (optional part of move)
     * @param {number} from_row
     * @param {number} from_col
     * @param {number} to_row
     * @param {number} to_col
     */
    move_neutral_piece(from_row, from_col, to_row, to_col) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.lgame_move_neutral_piece(retptr, this.__wbg_ptr, from_row, from_col, to_row, to_col);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get game status summary for debugging
     * @returns {string}
     */
    get_status_summary() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.lgame_get_status_summary(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export_1(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Get memory usage of the game state (for performance monitoring)
     * @returns {number}
     */
    memory_usage() {
        const ret = wasm.lgame_memory_usage(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Get current player (frontend naming convention)
     * @returns {Player}
     */
    get_current_player() {
        const ret = wasm.lgame_get_current_player(this.__wbg_ptr);
        return ret;
    }
    /**
     * Get move count (frontend naming convention)
     * @returns {number}
     */
    get_move_count() {
        const ret = wasm.lgame_get_move_count(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Get winner (frontend naming convention)
     * @returns {Player | undefined}
     */
    get_winner() {
        const ret = wasm.lgame_get_winner(this.__wbg_ptr);
        return ret === 0 ? undefined : ret;
    }
    /**
     * Check if game is over (frontend naming convention)
     * @returns {boolean}
     */
    is_game_over() {
        const ret = wasm.lgame_is_game_over(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Get board state as flat array for frontend (4 rows × 4 cols = 16 elements)
     * Returns: 0=empty, 1=player1, 2=player2, 3=neutral
     * @returns {Uint8Array}
     */
    get_board() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.lgame_get_board(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var v1 = getArrayU8FromWasm0(r0, r1).slice();
            wasm.__wbindgen_export_1(r0, r1 * 1, 1);
            return v1;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Check if undo is possible
     * @returns {boolean}
     */
    can_undo() {
        const ret = wasm.lgame_can_undo(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Undo the last move
     * @returns {boolean}
     */
    undo_move() {
        const ret = wasm.lgame_undo_move(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Analyze current position comprehensively
     * @returns {PositionAnalysis}
     */
    analyze_position() {
        const ret = wasm.lgame_analyze_position(this.__wbg_ptr);
        return PositionAnalysis.__wrap(ret);
    }
    /**
     * Get current game phase for AI strategy
     * @returns {GamePhase}
     */
    get_game_phase() {
        const ret = wasm.lgame_get_game_phase(this.__wbg_ptr);
        return ret;
    }
    /**
     * Reset game with a specific starting player
     * @param {Player} starting_player
     */
    reset_with_starting_player(starting_player) {
        wasm.lgame_reset_with_starting_player(this.__wbg_ptr, starting_player);
    }
    /**
     * Reset game to initial state
     */
    reset() {
        wasm.lgame_newGame(this.__wbg_ptr);
    }
    /**
     * Frontend-friendly method aliases (Connect4 compatibility)
     */
    newGame() {
        wasm.lgame_newGame(this.__wbg_ptr);
    }
    /**
     * @returns {boolean}
     */
    undoMove() {
        const ret = wasm.lgame_undoMove(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Get valid L-piece moves for current player (for frontend)
     * @returns {string}
     */
    get_valid_l_moves_json() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.lgame_get_valid_l_moves_json(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export_1(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * Check if a specific L-piece move is valid
     * @param {number} row
     * @param {number} col
     * @param {number} orientation
     * @returns {boolean}
     */
    is_valid_l_move(row, col, orientation) {
        const ret = wasm.lgame_is_valid_l_move(this.__wbg_ptr, row, col, orientation);
        return ret !== 0;
    }
    /**
     * Get neutral piece positions
     * @returns {Uint8Array}
     */
    get_neutral_positions() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.lgame_get_neutral_positions(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var v1 = getArrayU8FromWasm0(r0, r1).slice();
            wasm.__wbindgen_export_1(r0, r1 * 1, 1);
            return v1;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get L-piece position for a specific player
     * @param {Player} player
     * @returns {Uint8Array}
     */
    get_l_piece_position(player) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.lgame_get_l_piece_position(retptr, this.__wbg_ptr, player);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var v1 = getArrayU8FromWasm0(r0, r1).slice();
            wasm.__wbindgen_export_1(r0, r1 * 1, 1);
            return v1;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
}

const PositionAnalysisFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_positionanalysis_free(ptr >>> 0, 1));
/**
 * Position analysis structure for AI decision making
 */
export class PositionAnalysis {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(PositionAnalysis.prototype);
        obj.__wbg_ptr = ptr;
        PositionAnalysisFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        PositionAnalysisFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_positionanalysis_free(ptr, 0);
    }
    /**
     * @returns {number}
     */
    get current_player_threats() {
        const ret = wasm.__wbg_get_aimove_row(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @param {number} arg0
     */
    set current_player_threats(arg0) {
        wasm.__wbg_set_aimove_row(this.__wbg_ptr, arg0);
    }
    /**
     * @returns {number}
     */
    get opponent_threats() {
        const ret = wasm.__wbg_get_aimove_col(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @param {number} arg0
     */
    set opponent_threats(arg0) {
        wasm.__wbg_set_aimove_col(this.__wbg_ptr, arg0);
    }
    /**
     * @returns {number}
     */
    get total_pieces() {
        const ret = wasm.__wbg_get_positionanalysis_total_pieces(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @param {number} arg0
     */
    set total_pieces(arg0) {
        wasm.__wbg_set_positionanalysis_total_pieces(this.__wbg_ptr, arg0);
    }
    /**
     * @returns {number}
     */
    get connectivity_score() {
        const ret = wasm.__wbg_get_positionanalysis_connectivity_score(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {number} arg0
     */
    set connectivity_score(arg0) {
        wasm.__wbg_set_positionanalysis_connectivity_score(this.__wbg_ptr, arg0);
    }
    /**
     * @returns {GamePhase}
     */
    get game_phase() {
        const ret = wasm.__wbg_get_positionanalysis_game_phase(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {GamePhase} arg0
     */
    set game_phase(arg0) {
        wasm.__wbg_set_positionanalysis_game_phase(this.__wbg_ptr, arg0);
    }
    /**
     * @returns {number}
     */
    get evaluation_score() {
        const ret = wasm.__wbg_get_positionanalysis_evaluation_score(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {number} arg0
     */
    set evaluation_score(arg0) {
        wasm.__wbg_set_positionanalysis_evaluation_score(this.__wbg_ptr, arg0);
    }
    /**
     * @returns {number}
     */
    get get_current_player_threats() {
        const ret = wasm.positionanalysis_get_current_player_threats(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    get get_opponent_threats() {
        const ret = wasm.positionanalysis_get_opponent_threats(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    get get_total_pieces() {
        const ret = wasm.positionanalysis_get_total_pieces(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    get get_connectivity_score() {
        const ret = wasm.positionanalysis_get_connectivity_score(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {GamePhase}
     */
    get get_game_phase() {
        const ret = wasm.positionanalysis_get_game_phase(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get get_evaluation_score() {
        const ret = wasm.positionanalysis_get_evaluation_score(this.__wbg_ptr);
        return ret;
    }
    /**
     * Get threat advantage (positive = current player has more threats)
     * @returns {number}
     */
    threat_advantage() {
        const ret = wasm.positionanalysis_threat_advantage(this.__wbg_ptr);
        return ret;
    }
    /**
     * Check if position is tactically critical
     * @returns {boolean}
     */
    is_critical() {
        const ret = wasm.positionanalysis_is_critical(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Get position summary as string for debugging
     * @returns {string}
     */
    summary() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.positionanalysis_summary(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export_1(deferred1_0, deferred1_1, 1);
        }
    }
}

const ReachabilityAnalysisFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_reachabilityanalysis_free(ptr >>> 0, 1));

export class ReachabilityAnalysis {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(ReachabilityAnalysis.prototype);
        obj.__wbg_ptr = ptr;
        ReachabilityAnalysisFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        ReachabilityAnalysisFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_reachabilityanalysis_free(ptr, 0);
    }
    /**
     * @returns {Int16Array}
     */
    get get_reachable_targets() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.reachabilityanalysis_get_reachable_targets(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var v1 = getArrayI16FromWasm0(r0, r1).slice();
            wasm.__wbindgen_export_1(r0, r1 * 2, 2);
            return v1;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * @returns {Int16Array}
     */
    get get_unreachable_targets() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.reachabilityanalysis_get_unreachable_targets(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var v1 = getArrayI16FromWasm0(r0, r1).slice();
            wasm.__wbindgen_export_1(r0, r1 * 2, 2);
            return v1;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * @returns {number}
     */
    get get_total_reachable() {
        const ret = wasm.reachabilityanalysis_get_total_reachable(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    get get_coverage_percentage() {
        const ret = wasm.reachabilityanalysis_get_coverage_percentage(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get get_min_reachable() {
        const ret = wasm.reachabilityanalysis_get_min_reachable(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get get_max_reachable() {
        const ret = wasm.reachabilityanalysis_get_max_reachable(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {string}
     */
    summary() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.reachabilityanalysis_summary(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export_1(deferred1_0, deferred1_1, 1);
        }
    }
}

const SolutionAnalysisFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_solutionanalysis_free(ptr >>> 0, 1));

export class SolutionAnalysis {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(SolutionAnalysis.prototype);
        obj.__wbg_ptr = ptr;
        SolutionAnalysisFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        SolutionAnalysisFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_solutionanalysis_free(ptr, 0);
    }
    /**
     * @returns {number}
     */
    get get_target() {
        const ret = wasm.solutionanalysis_get_target(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {number}
     */
    get get_total_solutions() {
        const ret = wasm.solutionanalysis_get_total_solutions(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {string[]}
     */
    get get_unique_formulas() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.solutionanalysis_get_unique_formulas(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var v1 = getArrayJsValueFromWasm0(r0, r1).slice();
            wasm.__wbindgen_export_1(r0, r1 * 4, 4);
            return v1;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * @returns {number}
     */
    get get_add_operations() {
        const ret = wasm.solutionanalysis_get_add_operations(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    get get_subtract_operations() {
        const ret = wasm.solutionanalysis_get_subtract_operations(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {number}
     */
    get get_difficulty_score() {
        const ret = wasm.solutionanalysis_get_difficulty_score(this.__wbg_ptr);
        return ret;
    }
    /**
     * @returns {string}
     */
    summary() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.solutionanalysis_summary(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export_1(deferred1_0, deferred1_1, 1);
        }
    }
}

const TrioGameFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_triogame_free(ptr >>> 0, 1));
/**
 * Trio Game using 3-Layer Architecture for clean separation of concerns
 *
 * Trio is a mathematical puzzle game where players find combinations
 * of three LINEAR numbers (a, b, c) that satisfy: a×b+c = target OR a×b-c = target
 *
 * Features:
 * - 7×7 board filled with numbers 1-9
 * - BitPacked storage: 4 bits per cell (supports 0-15, perfect for 1-9)
 * - Linear constraints: Only straight lines (horizontal/vertical/diagonal) allowed
 * - Optimized algorithm: 120 linear patterns instead of 117,649 brute force
 * - Memory efficient: 25 bytes vs 49 bytes naive implementation (49% reduction)
 */
export class TrioGame {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        TrioGameFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_triogame_free(ptr, 0);
    }
    /**
     * Create new Trio game with specified difficulty
     * @param {number} difficulty
     */
    constructor(difficulty) {
        const ret = wasm.triogame_new(difficulty);
        this.__wbg_ptr = ret >>> 0;
        TrioGameFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Get number at specific board position
     * @param {number} row
     * @param {number} col
     * @returns {number}
     */
    get_number(row, col) {
        const ret = wasm.triogame_get_number(this.__wbg_ptr, row, col);
        return ret;
    }
    /**
     * Get the current target number to achieve
     * @returns {number}
     */
    get_target_number() {
        const ret = wasm.triogame_get_target_number(this.__wbg_ptr);
        return ret;
    }
    /**
     * Get current difficulty level
     * @returns {number}
     */
    get_difficulty() {
        const ret = wasm.triogame_get_difficulty(this.__wbg_ptr);
        return ret;
    }
    /**
     * Validate a trio combination with adjacency check
     * Returns the calculated result if valid, or -1 if invalid
     * @param {number} row1
     * @param {number} col1
     * @param {number} row2
     * @param {number} col2
     * @param {number} row3
     * @param {number} col3
     * @returns {number}
     */
    validate_trio(row1, col1, row2, col2, row3, col3) {
        const ret = wasm.triogame_validate_trio(this.__wbg_ptr, row1, col1, row2, col2, row3, col3);
        return ret;
    }
    /**
     * Generate new board with specified difficulty
     * @param {number} difficulty
     * @returns {number}
     */
    generate_new_board(difficulty) {
        const ret = wasm.triogame_generate_new_board(this.__wbg_ptr, difficulty);
        return ret;
    }
    /**
     * Find all possible trio solutions using optimized adjacency algorithm
     * Optimization: Only check valid adjacent triplets (~200) instead of all combinations (117,649)
     * @returns {Uint8Array}
     */
    find_all_solutions() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.triogame_find_all_solutions(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var v1 = getArrayU8FromWasm0(r0, r1).slice();
            wasm.__wbindgen_export_1(r0, r1 * 1, 1);
            return v1;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get memory usage of the BitPacked board
     * @returns {number}
     */
    memory_usage() {
        const ret = wasm.triogame_memory_usage(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Get memory efficiency compared to naive implementation
     * @returns {number}
     */
    memory_efficiency() {
        const ret = wasm.triogame_memory_efficiency(this.__wbg_ptr);
        return ret;
    }
    /**
     * Get entire board as flat array for JavaScript
     * @returns {Uint8Array}
     */
    get_board_array() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.triogame_get_board_array(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var v1 = getArrayU8FromWasm0(r0, r1).slice();
            wasm.__wbindgen_export_1(r0, r1 * 1, 1);
            return v1;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * Get count of adjacent patterns for performance info
     * @returns {number}
     */
    get_adjacency_pattern_count() {
        const ret = wasm.triogame_get_adjacency_pattern_count(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Connect4-compatible API: Get current player
     * @returns {number}
     */
    get_current_player() {
        const ret = wasm.triogame_get_current_player(this.__wbg_ptr);
        return ret;
    }
    /**
     * Connect4-compatible API: Make a move (mark found solution)
     * @param {number} row1
     * @param {number} col1
     * @param {number} row2
     * @param {number} col2
     * @param {number} row3
     * @param {number} col3
     * @returns {boolean}
     */
    make_move(row1, col1, row2, col2, row3, col3) {
        const ret = wasm.triogame_make_move(this.__wbg_ptr, row1, col1, row2, col2, row3, col3);
        return ret !== 0;
    }
    /**
     * Connect4-compatible API: Reset game
     */
    reset() {
        wasm.triogame_reset(this.__wbg_ptr);
    }
    /**
     * Connect4-compatible API: Get move count
     * @returns {number}
     */
    get_move_count() {
        const ret = wasm.triogame_get_move_count(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * Connect4-compatible API: Get winner (puzzle completed when all solutions found)
     * @returns {number}
     */
    get_winner() {
        const ret = wasm.triogame_get_winner(this.__wbg_ptr);
        return ret;
    }
    /**
     * Get game phase for UI consistency
     * @returns {number}
     */
    get_game_phase() {
        const ret = wasm.triogame_get_game_phase(this.__wbg_ptr);
        return ret;
    }
}

const TrioGameLegacyFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_triogamelegacy_free(ptr >>> 0, 1));

export class TrioGameLegacy {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(TrioGameLegacy.prototype);
        obj.__wbg_ptr = ptr;
        TrioGameLegacyFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        TrioGameLegacyFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_triogamelegacy_free(ptr, 0);
    }
    /**
     * @param {number} difficulty
     */
    constructor(difficulty) {
        const ret = wasm.triogamelegacy_new(difficulty);
        this.__wbg_ptr = ret >>> 0;
        TrioGameLegacyFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @returns {Int8Array}
     */
    get_board() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.triogamelegacy_get_board(retptr, this.__wbg_ptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            var v1 = getArrayI8FromWasm0(r0, r1).slice();
            wasm.__wbindgen_export_1(r0, r1 * 1, 1);
            return v1;
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    /**
     * @returns {number}
     */
    get_target_number() {
        const ret = wasm.triogamelegacy_get_target_number(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {number} r1
     * @param {number} c1
     * @param {number} r2
     * @param {number} c2
     * @param {number} r3
     * @param {number} c3
     * @returns {boolean}
     */
    check_combination(r1, c1, r2, c2, r3, c3) {
        const ret = wasm.triogamelegacy_check_combination(this.__wbg_ptr, r1, c1, r2, c2, r3, c3);
        return ret !== 0;
    }
    /**
     * Create new game with specific distribution (WASM-exposed)
     * @param {TrioDistribution} distribution
     * @returns {TrioGameLegacy}
     */
    static new_with_distribution_wasm(distribution) {
        const ret = wasm.triogamelegacy_new_with_distribution_wasm(distribution);
        return TrioGameLegacy.__wrap(ret);
    }
    /**
     * Analyze reachable targets (WASM-exposed)
     * @returns {ReachabilityAnalysis}
     */
    analyze_reachable_targets_wasm() {
        const ret = wasm.triogamelegacy_analyze_reachable_targets_wasm(this.__wbg_ptr);
        return ReachabilityAnalysis.__wrap(ret);
    }
    /**
     * Count solutions for target (WASM-exposed)
     * @param {number} target
     * @returns {SolutionAnalysis}
     */
    count_solutions_for_target_wasm(target) {
        const ret = wasm.triogamelegacy_count_solutions_for_target_wasm(this.__wbg_ptr, target);
        return SolutionAnalysis.__wrap(ret);
    }
    /**
     * Get difficulty category (WASM-exposed)
     * @param {number} target
     * @returns {TrioDifficulty}
     */
    categorize_target_difficulty_wasm(target) {
        const ret = wasm.triogamelegacy_categorize_target_difficulty_wasm(this.__wbg_ptr, target);
        return ret;
    }
    /**
     * Perform comprehensive gap analysis for all distributions
     * @returns {string}
     */
    static comprehensive_gap_analysis() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.triogamelegacy_comprehensive_gap_analysis(retptr);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            deferred1_0 = r0;
            deferred1_1 = r1;
            return getStringFromWasm0(r0, r1);
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
            wasm.__wbindgen_export_1(deferred1_0, deferred1_1, 1);
        }
    }
}

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);

            } catch (e) {
                if (module.headers.get('Content-Type') != 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else {
                    throw e;
                }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);

    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };

        } else {
            return instance;
        }
    }
}

function __wbg_get_imports() {
    const imports = {};
    imports.wbg = {};
    imports.wbg.__wbg_buffer_609cc3eee51ed158 = function(arg0) {
        const ret = getObject(arg0).buffer;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_call_672a4d21634d4a24 = function() { return handleError(function (arg0, arg1) {
        const ret = getObject(arg0).call(getObject(arg1));
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_call_7cccdd69e0791ae2 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = getObject(arg0).call(getObject(arg1), getObject(arg2));
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_crypto_574e78ad8b13b65f = function(arg0) {
        const ret = getObject(arg0).crypto;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_error_7534b8e9a36f1ab4 = function(arg0, arg1) {
        let deferred0_0;
        let deferred0_1;
        try {
            deferred0_0 = arg0;
            deferred0_1 = arg1;
            console.error(getStringFromWasm0(arg0, arg1));
        } finally {
            wasm.__wbindgen_export_1(deferred0_0, deferred0_1, 1);
        }
    };
    imports.wbg.__wbg_getRandomValues_b8f5dbd5f3995a9e = function() { return handleError(function (arg0, arg1) {
        getObject(arg0).getRandomValues(getObject(arg1));
    }, arguments) };
    imports.wbg.__wbg_log_c222819a41e063d3 = function(arg0) {
        console.log(getObject(arg0));
    };
    imports.wbg.__wbg_msCrypto_a61aeb35a24c1329 = function(arg0) {
        const ret = getObject(arg0).msCrypto;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_new_8a6f238a6ece86ea = function() {
        const ret = new Error();
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_new_a12002a7f91c75be = function(arg0) {
        const ret = new Uint8Array(getObject(arg0));
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_newnoargs_105ed471475aaf50 = function(arg0, arg1) {
        const ret = new Function(getStringFromWasm0(arg0, arg1));
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_newwithbyteoffsetandlength_d97e637ebe145a9a = function(arg0, arg1, arg2) {
        const ret = new Uint8Array(getObject(arg0), arg1 >>> 0, arg2 >>> 0);
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_newwithlength_a381634e90c276d4 = function(arg0) {
        const ret = new Uint8Array(arg0 >>> 0);
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_node_905d3e251edff8a2 = function(arg0) {
        const ret = getObject(arg0).node;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_process_dc0fbacc7c1c06f7 = function(arg0) {
        const ret = getObject(arg0).process;
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_randomFillSync_ac0988aba3254290 = function() { return handleError(function (arg0, arg1) {
        getObject(arg0).randomFillSync(takeObject(arg1));
    }, arguments) };
    imports.wbg.__wbg_require_60cc747a6bc5215a = function() { return handleError(function () {
        const ret = module.require;
        return addHeapObject(ret);
    }, arguments) };
    imports.wbg.__wbg_set_65595bdd868b3009 = function(arg0, arg1, arg2) {
        getObject(arg0).set(getObject(arg1), arg2 >>> 0);
    };
    imports.wbg.__wbg_stack_0ed75d68575b0f3c = function(arg0, arg1) {
        const ret = getObject(arg1).stack;
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_export_2, wasm.__wbindgen_export_3);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
    };
    imports.wbg.__wbg_static_accessor_GLOBAL_88a902d13a557d07 = function() {
        const ret = typeof global === 'undefined' ? null : global;
        return isLikeNone(ret) ? 0 : addHeapObject(ret);
    };
    imports.wbg.__wbg_static_accessor_GLOBAL_THIS_56578be7e9f832b0 = function() {
        const ret = typeof globalThis === 'undefined' ? null : globalThis;
        return isLikeNone(ret) ? 0 : addHeapObject(ret);
    };
    imports.wbg.__wbg_static_accessor_SELF_37c5d418e4bf5819 = function() {
        const ret = typeof self === 'undefined' ? null : self;
        return isLikeNone(ret) ? 0 : addHeapObject(ret);
    };
    imports.wbg.__wbg_static_accessor_WINDOW_5de37043a91a9c40 = function() {
        const ret = typeof window === 'undefined' ? null : window;
        return isLikeNone(ret) ? 0 : addHeapObject(ret);
    };
    imports.wbg.__wbg_subarray_aa9065fa9dc5df96 = function(arg0, arg1, arg2) {
        const ret = getObject(arg0).subarray(arg1 >>> 0, arg2 >>> 0);
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_versions_c01dfd4722a88165 = function(arg0) {
        const ret = getObject(arg0).versions;
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_is_function = function(arg0) {
        const ret = typeof(getObject(arg0)) === 'function';
        return ret;
    };
    imports.wbg.__wbindgen_is_object = function(arg0) {
        const val = getObject(arg0);
        const ret = typeof(val) === 'object' && val !== null;
        return ret;
    };
    imports.wbg.__wbindgen_is_string = function(arg0) {
        const ret = typeof(getObject(arg0)) === 'string';
        return ret;
    };
    imports.wbg.__wbindgen_is_undefined = function(arg0) {
        const ret = getObject(arg0) === undefined;
        return ret;
    };
    imports.wbg.__wbindgen_memory = function() {
        const ret = wasm.memory;
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_number_new = function(arg0) {
        const ret = arg0;
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_object_clone_ref = function(arg0) {
        const ret = getObject(arg0);
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_object_drop_ref = function(arg0) {
        takeObject(arg0);
    };
    imports.wbg.__wbindgen_string_new = function(arg0, arg1) {
        const ret = getStringFromWasm0(arg0, arg1);
        return addHeapObject(ret);
    };
    imports.wbg.__wbindgen_throw = function(arg0, arg1) {
        throw new Error(getStringFromWasm0(arg0, arg1));
    };

    return imports;
}

function __wbg_init_memory(imports, memory) {

}

function __wbg_finalize_init(instance, module) {
    wasm = instance.exports;
    __wbg_init.__wbindgen_wasm_module = module;
    cachedDataViewMemory0 = null;
    cachedInt16ArrayMemory0 = null;
    cachedInt8ArrayMemory0 = null;
    cachedUint32ArrayMemory0 = null;
    cachedUint8ArrayMemory0 = null;


    wasm.__wbindgen_start();
    return wasm;
}

function initSync(module) {
    if (wasm !== undefined) return wasm;


    if (typeof module !== 'undefined') {
        if (Object.getPrototypeOf(module) === Object.prototype) {
            ({module} = module)
        } else {
            console.warn('using deprecated parameters for `initSync()`; pass a single object instead')
        }
    }

    const imports = __wbg_get_imports();

    __wbg_init_memory(imports);

    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }

    const instance = new WebAssembly.Instance(module, imports);

    return __wbg_finalize_init(instance, module);
}

async function __wbg_init(module_or_path) {
    if (wasm !== undefined) return wasm;


    if (typeof module_or_path !== 'undefined') {
        if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
            ({module_or_path} = module_or_path)
        } else {
            console.warn('using deprecated parameters for the initialization function; pass a single object instead')
        }
    }

    if (typeof module_or_path === 'undefined') {
        module_or_path = new URL('game_engine_bg.wasm', import.meta.url);
    }
    const imports = __wbg_get_imports();

    if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
        module_or_path = fetch(module_or_path);
    }

    __wbg_init_memory(imports);

    const { instance, module } = await __wbg_load(await module_or_path, imports);

    return __wbg_finalize_init(instance, module);
}

export { initSync };
export default __wbg_init;

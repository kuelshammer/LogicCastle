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

function debugString(val) {
    // primitive types
    const type = typeof val;
    if (type == 'number' || type == 'boolean' || val == null) {
        return  `${val}`;
    }
    if (type == 'string') {
        return `"${val}"`;
    }
    if (type == 'symbol') {
        const description = val.description;
        if (description == null) {
            return 'Symbol';
        } else {
            return `Symbol(${description})`;
        }
    }
    if (type == 'function') {
        const name = val.name;
        if (typeof name == 'string' && name.length > 0) {
            return `Function(${name})`;
        } else {
            return 'Function';
        }
    }
    // objects
    if (Array.isArray(val)) {
        const length = val.length;
        let debug = '[';
        if (length > 0) {
            debug += debugString(val[0]);
        }
        for(let i = 1; i < length; i++) {
            debug += ', ' + debugString(val[i]);
        }
        debug += ']';
        return debug;
    }
    // Test for built-in
    const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val));
    let className;
    if (builtInMatches && builtInMatches.length > 1) {
        className = builtInMatches[1];
    } else {
        // Failed to match the standard '[object ClassName]'
        return toString.call(val);
    }
    if (className == 'Object') {
        // we're a user defined class or Object
        // JSON.stringify avoids problems with cycles, and is generally much
        // easier than looping through ownProperties of `val`.
        try {
            return 'Object(' + JSON.stringify(val) + ')';
        } catch (_) {
            return 'Object';
        }
    }
    // errors
    if (val instanceof Error) {
        return `${val.name}: ${val.message}\n${val.stack}`;
    }
    // TODO we could test for more things here, like `Set`s and `Map`s.
    return className;
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
 * @enum {1 | 2}
 */
export const Player = Object.freeze({
    Yellow: 1, "1": "Yellow",
    Red: 2, "2": "Red",
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
 * @enum {0 | 1 | 2 | 3}
 */
export const TrioDistribution = Object.freeze({
    Balanced: 0, "0": "Balanced",
    Educational: 1, "1": "Educational",
    Challenging: 2, "2": "Challenging",
    Official: 3, "3": "Official",
});

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

const HexBoardFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_hexboard_free(ptr >>> 0, 1));

export class HexBoard {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        HexBoardFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_hexboard_free(ptr, 0);
    }
    constructor() {
        const ret = wasm.hexboard_new();
        this.__wbg_ptr = ret >>> 0;
        HexBoardFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @param {number} row
     * @param {number} col
     * @returns {number}
     */
    get_cell(row, col) {
        const ret = wasm.hexboard_get_cell(this.__wbg_ptr, row, col);
        return ret;
    }
    /**
     * @param {number} row
     * @param {number} col
     * @param {number} value
     */
    set_cell(row, col, value) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.hexboard_set_cell(retptr, this.__wbg_ptr, row, col, value);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
    clear() {
        wasm.hexboard_clear(this.__wbg_ptr);
    }
    /**
     * @returns {number}
     */
    memory_usage() {
        const ret = wasm.hexboard_memory_usage(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @returns {Uint32Array}
     */
    dimensions() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.hexboard_dimensions(retptr, this.__wbg_ptr);
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
     * @param {number} row
     * @param {number} col
     * @returns {boolean}
     */
    is_valid_position(row, col) {
        const ret = wasm.hexboard_is_valid_position(this.__wbg_ptr, row, col);
        return ret !== 0;
    }
    /**
     * @param {number} player
     * @returns {number}
     */
    count_stones(player) {
        const ret = wasm.hexboard_count_stones(this.__wbg_ptr, player);
        return ret >>> 0;
    }
    /**
     * Get board state as simple string for debugging
     * @returns {string}
     */
    get_board_debug() {
        let deferred1_0;
        let deferred1_1;
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.hexboard_get_board_debug(retptr, this.__wbg_ptr);
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

const LGameFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_lgame_free(ptr >>> 0, 1));
/**
 * L-Game main struct - Edward de Bono's strategic blockade game
 */
export class LGame {

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
     * Create new L-Game in standard starting position
     */
    constructor() {
        const ret = wasm.lgame_new();
        this.__wbg_ptr = ret >>> 0;
        LGameFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * Get current board state as Int8Array for JavaScript
     * @returns {Int8Array}
     */
    getBoard() {
        const ret = wasm.lgame_getBoard(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
     * Get current player
     * @returns {Player}
     */
    getCurrentPlayer() {
        const ret = wasm.lgame_getCurrentPlayer(this.__wbg_ptr);
        return ret;
    }
    /**
     * Check if game is over
     * @returns {boolean}
     */
    isGameOver() {
        const ret = wasm.lgame_isGameOver(this.__wbg_ptr);
        return ret !== 0;
    }
    /**
     * Get winner if game is over
     * @returns {Player | undefined}
     */
    getWinner() {
        const ret = wasm.lgame_getWinner(this.__wbg_ptr);
        return ret === 0 ? undefined : ret;
    }
    /**
     * Get legal moves for current player
     * @returns {Array<any>}
     */
    getLegalMoves() {
        const ret = wasm.lgame_getLegalMoves(this.__wbg_ptr);
        return takeObject(ret);
    }
    /**
     * Make a move (L-piece movement + optional neutral piece movement)
     * @param {number} l_anchor_row
     * @param {number} l_anchor_col
     * @param {number} l_orientation
     * @param {number | null} [neutral_id]
     * @param {number | null} [neutral_row]
     * @param {number | null} [neutral_col]
     */
    makeMove(l_anchor_row, l_anchor_col, l_orientation, neutral_id, neutral_row, neutral_col) {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.lgame_makeMove(retptr, this.__wbg_ptr, l_anchor_row, l_anchor_col, l_orientation, isLikeNone(neutral_id) ? 0xFFFFFF : neutral_id, isLikeNone(neutral_row) ? 0xFFFFFF : neutral_row, isLikeNone(neutral_col) ? 0xFFFFFF : neutral_col);
            var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
            var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
            if (r1) {
                throw takeObject(r0);
            }
        } finally {
            wasm.__wbindgen_add_to_stack_pointer(16);
        }
    }
}

const LGameMoveFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_lgamemove_free(ptr >>> 0, 1));
/**
 * L-Game move representation
 */
export class LGameMove {

    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        LGameMoveFinalization.unregister(this);
        return ptr;
    }

    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_lgamemove_free(ptr, 0);
    }
    /**
     * @returns {number}
     */
    get l_piece_anchor_row() {
        const ret = wasm.__wbg_get_lgamemove_l_piece_anchor_row(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {number} arg0
     */
    set l_piece_anchor_row(arg0) {
        wasm.__wbg_set_lgamemove_l_piece_anchor_row(this.__wbg_ptr, arg0);
    }
    /**
     * @returns {number}
     */
    get l_piece_anchor_col() {
        const ret = wasm.__wbg_get_lgamemove_l_piece_anchor_col(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {number} arg0
     */
    set l_piece_anchor_col(arg0) {
        wasm.__wbg_set_lgamemove_l_piece_anchor_col(this.__wbg_ptr, arg0);
    }
    /**
     * @returns {number}
     */
    get l_piece_orientation() {
        const ret = wasm.__wbg_get_lgamemove_l_piece_orientation(this.__wbg_ptr);
        return ret;
    }
    /**
     * @param {number} arg0
     */
    set l_piece_orientation(arg0) {
        wasm.__wbg_set_lgamemove_l_piece_orientation(this.__wbg_ptr, arg0);
    }
    /**
     * @returns {number | undefined}
     */
    get neutral_piece_id() {
        const ret = wasm.__wbg_get_lgamemove_neutral_piece_id(this.__wbg_ptr);
        return ret === 0xFFFFFF ? undefined : ret;
    }
    /**
     * @param {number | null} [arg0]
     */
    set neutral_piece_id(arg0) {
        wasm.__wbg_set_lgamemove_neutral_piece_id(this.__wbg_ptr, isLikeNone(arg0) ? 0xFFFFFF : arg0);
    }
    /**
     * @returns {number | undefined}
     */
    get neutral_new_row() {
        const ret = wasm.__wbg_get_lgamemove_neutral_new_row(this.__wbg_ptr);
        return ret === 0xFFFFFF ? undefined : ret;
    }
    /**
     * @param {number | null} [arg0]
     */
    set neutral_new_row(arg0) {
        wasm.__wbg_set_lgamemove_neutral_new_row(this.__wbg_ptr, isLikeNone(arg0) ? 0xFFFFFF : arg0);
    }
    /**
     * @returns {number | undefined}
     */
    get neutral_new_col() {
        const ret = wasm.__wbg_get_lgamemove_neutral_new_col(this.__wbg_ptr);
        return ret === 0xFFFFFF ? undefined : ret;
    }
    /**
     * @param {number | null} [arg0]
     */
    set neutral_new_col(arg0) {
        wasm.__wbg_set_lgamemove_neutral_new_col(this.__wbg_ptr, isLikeNone(arg0) ? 0xFFFFFF : arg0);
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
        const ret = wasm.__wbg_get_positionanalysis_current_player_threats(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @param {number} arg0
     */
    set current_player_threats(arg0) {
        wasm.__wbg_set_positionanalysis_current_player_threats(this.__wbg_ptr, arg0);
    }
    /**
     * @returns {number}
     */
    get opponent_threats() {
        const ret = wasm.__wbg_get_positionanalysis_opponent_threats(this.__wbg_ptr);
        return ret >>> 0;
    }
    /**
     * @param {number} arg0
     */
    set opponent_threats(arg0) {
        wasm.__wbg_set_positionanalysis_opponent_threats(this.__wbg_ptr, arg0);
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

export class TrioGame {

    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(TrioGame.prototype);
        obj.__wbg_ptr = ptr;
        TrioGameFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }

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
     * @param {number} difficulty
     */
    constructor(difficulty) {
        const ret = wasm.triogame_new(difficulty);
        this.__wbg_ptr = ret >>> 0;
        TrioGameFinalization.register(this, this.__wbg_ptr, this);
        return this;
    }
    /**
     * @returns {Int8Array}
     */
    get_board() {
        try {
            const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
            wasm.triogame_get_board(retptr, this.__wbg_ptr);
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
        const ret = wasm.triogame_get_target_number(this.__wbg_ptr);
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
        const ret = wasm.triogame_check_combination(this.__wbg_ptr, r1, c1, r2, c2, r3, c3);
        return ret !== 0;
    }
    /**
     * Create new game with specific distribution (WASM-exposed)
     * @param {TrioDistribution} distribution
     * @returns {TrioGame}
     */
    static new_with_distribution_wasm(distribution) {
        const ret = wasm.triogame_new_with_distribution_wasm(distribution);
        return TrioGame.__wrap(ret);
    }
    /**
     * Analyze reachable targets (WASM-exposed)
     * @returns {ReachabilityAnalysis}
     */
    analyze_reachable_targets_wasm() {
        const ret = wasm.triogame_analyze_reachable_targets_wasm(this.__wbg_ptr);
        return ReachabilityAnalysis.__wrap(ret);
    }
    /**
     * Count solutions for target (WASM-exposed)
     * @param {number} target
     * @returns {SolutionAnalysis}
     */
    count_solutions_for_target_wasm(target) {
        const ret = wasm.triogame_count_solutions_for_target_wasm(this.__wbg_ptr, target);
        return SolutionAnalysis.__wrap(ret);
    }
    /**
     * Get difficulty category (WASM-exposed)
     * @param {number} target
     * @returns {TrioDifficulty}
     */
    categorize_target_difficulty_wasm(target) {
        const ret = wasm.triogame_categorize_target_difficulty_wasm(this.__wbg_ptr, target);
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
            wasm.triogame_comprehensive_gap_analysis(retptr);
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
    imports.wbg.__wbg_new_405e22f390576ce2 = function() {
        const ret = new Object();
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_new_78feb108b6472713 = function() {
        const ret = new Array();
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_new_8a6f238a6ece86ea = function() {
        const ret = new Error();
        return addHeapObject(ret);
    };
    imports.wbg.__wbg_new_8de0180919aeafa0 = function(arg0) {
        const ret = new Int8Array(getObject(arg0));
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
    imports.wbg.__wbg_newwithbyteoffsetandlength_840f3c038856d4e9 = function(arg0, arg1, arg2) {
        const ret = new Int8Array(getObject(arg0), arg1 >>> 0, arg2 >>> 0);
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
    imports.wbg.__wbg_push_737cfc8c1432c2c6 = function(arg0, arg1) {
        const ret = getObject(arg0).push(getObject(arg1));
        return ret;
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
    imports.wbg.__wbg_set_bb8cecf6a62b9f46 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = Reflect.set(getObject(arg0), getObject(arg1), getObject(arg2));
        return ret;
    }, arguments) };
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
    imports.wbg.__wbindgen_debug_string = function(arg0, arg1) {
        const ret = debugString(getObject(arg1));
        const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_export_2, wasm.__wbindgen_export_3);
        const len1 = WASM_VECTOR_LEN;
        getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
        getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
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

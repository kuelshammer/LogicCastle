let wasm;

function addToExternrefTable0(obj) {
    const idx = wasm.__externref_table_alloc();
    wasm.__wbindgen_export_2.set(idx, obj);
    return idx;
}

function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        const idx = addToExternrefTable0(e);
        wasm.__wbindgen_exn_store(idx);
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

function isLikeNone(x) {
    return x === undefined || x === null;
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

function takeFromExternrefTable0(idx) {
    const value = wasm.__wbindgen_export_2.get(idx);
    wasm.__externref_table_dealloc(idx);
    return value;
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
        const ret = wasm.board_get_cells(this.__wbg_ptr);
        var v1 = getArrayI8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * @param {number} row
     * @param {number} col
     * @returns {number}
     */
    get_cell(row, col) {
        const ret = wasm.board_get_cell(this.__wbg_ptr, row, col);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return ret[0];
    }
    /**
     * @param {number} row
     * @param {number} col
     * @param {number} value
     */
    set_cell(row, col, value) {
        const ret = wasm.board_set_cell(this.__wbg_ptr, row, col, value);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
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
        const ret = wasm.game_make_move_connect4_js(this.__wbg_ptr, col);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
        }
    }
    /**
     * @param {number} row
     * @param {number} col
     */
    make_move_gobang_js(row, col) {
        const ret = wasm.game_make_move_gobang_js(this.__wbg_ptr, row, col);
        if (ret[1]) {
            throw takeFromExternrefTable0(ret[0]);
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
        const ret = wasm.game_get_board(this.__wbg_ptr);
        var v1 = getArrayI8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * @returns {Player}
     */
    get_current_player() {
        const ret = wasm.game_get_current_player(this.__wbg_ptr);
        return ret;
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
        const ret = wasm.game_get_legal_moves_connect4(this.__wbg_ptr);
        var v1 = getArrayU32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
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
        const ret = wasm.game_simulate_move_connect4(this.__wbg_ptr, col);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return Game.__wrap(ret[0]);
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
        const ret = wasm.game_get_legal_moves_gobang(this.__wbg_ptr);
        var v1 = getArrayU32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * Simulate a Gobang move without mutating the current game state
     * @param {number} row
     * @param {number} col
     * @returns {Game}
     */
    simulate_move_gobang(row, col) {
        const ret = wasm.game_simulate_move_gobang(this.__wbg_ptr, row, col);
        if (ret[2]) {
            throw takeFromExternrefTable0(ret[1]);
        }
        return Game.__wrap(ret[0]);
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
        const ret = wasm.game_detect_bottom_row_forks(this.__wbg_ptr, opponent);
        var v1 = getArrayU32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * Get fork-blocking moves for current player (prevent opponent forks)
     * @returns {Uint32Array}
     */
    get_fork_blocking_moves() {
        const ret = wasm.game_get_fork_blocking_moves(this.__wbg_ptr);
        var v1 = getArrayU32FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 4, 4);
        return v1;
    }
    /**
     * Check if opponent has dangerous fork patterns that require immediate attention
     * @returns {boolean}
     */
    has_critical_fork_threats() {
        const ret = wasm.game_has_critical_fork_threats(this.__wbg_ptr);
        return ret !== 0;
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
        const ret = wasm.board_get_rows(this.__wbg_ptr);
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
        const ret = wasm.board_get_cols(this.__wbg_ptr);
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
            const ret = wasm.positionanalysis_summary(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
}

const TrioGameFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_triogame_free(ptr >>> 0, 1));

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
        const ret = wasm.triogame_get_board(this.__wbg_ptr);
        var v1 = getArrayI8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
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
        const ret = arg0.buffer;
        return ret;
    };
    imports.wbg.__wbg_call_672a4d21634d4a24 = function() { return handleError(function (arg0, arg1) {
        const ret = arg0.call(arg1);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_call_7cccdd69e0791ae2 = function() { return handleError(function (arg0, arg1, arg2) {
        const ret = arg0.call(arg1, arg2);
        return ret;
    }, arguments) };
    imports.wbg.__wbg_crypto_574e78ad8b13b65f = function(arg0) {
        const ret = arg0.crypto;
        return ret;
    };
    imports.wbg.__wbg_getRandomValues_b8f5dbd5f3995a9e = function() { return handleError(function (arg0, arg1) {
        arg0.getRandomValues(arg1);
    }, arguments) };
    imports.wbg.__wbg_msCrypto_a61aeb35a24c1329 = function(arg0) {
        const ret = arg0.msCrypto;
        return ret;
    };
    imports.wbg.__wbg_new_a12002a7f91c75be = function(arg0) {
        const ret = new Uint8Array(arg0);
        return ret;
    };
    imports.wbg.__wbg_newnoargs_105ed471475aaf50 = function(arg0, arg1) {
        const ret = new Function(getStringFromWasm0(arg0, arg1));
        return ret;
    };
    imports.wbg.__wbg_newwithbyteoffsetandlength_d97e637ebe145a9a = function(arg0, arg1, arg2) {
        const ret = new Uint8Array(arg0, arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_newwithlength_a381634e90c276d4 = function(arg0) {
        const ret = new Uint8Array(arg0 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_node_905d3e251edff8a2 = function(arg0) {
        const ret = arg0.node;
        return ret;
    };
    imports.wbg.__wbg_process_dc0fbacc7c1c06f7 = function(arg0) {
        const ret = arg0.process;
        return ret;
    };
    imports.wbg.__wbg_randomFillSync_ac0988aba3254290 = function() { return handleError(function (arg0, arg1) {
        arg0.randomFillSync(arg1);
    }, arguments) };
    imports.wbg.__wbg_require_60cc747a6bc5215a = function() { return handleError(function () {
        const ret = module.require;
        return ret;
    }, arguments) };
    imports.wbg.__wbg_set_65595bdd868b3009 = function(arg0, arg1, arg2) {
        arg0.set(arg1, arg2 >>> 0);
    };
    imports.wbg.__wbg_static_accessor_GLOBAL_88a902d13a557d07 = function() {
        const ret = typeof global === 'undefined' ? null : global;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_static_accessor_GLOBAL_THIS_56578be7e9f832b0 = function() {
        const ret = typeof globalThis === 'undefined' ? null : globalThis;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_static_accessor_SELF_37c5d418e4bf5819 = function() {
        const ret = typeof self === 'undefined' ? null : self;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_static_accessor_WINDOW_5de37043a91a9c40 = function() {
        const ret = typeof window === 'undefined' ? null : window;
        return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
    };
    imports.wbg.__wbg_subarray_aa9065fa9dc5df96 = function(arg0, arg1, arg2) {
        const ret = arg0.subarray(arg1 >>> 0, arg2 >>> 0);
        return ret;
    };
    imports.wbg.__wbg_versions_c01dfd4722a88165 = function(arg0) {
        const ret = arg0.versions;
        return ret;
    };
    imports.wbg.__wbindgen_init_externref_table = function() {
        const table = wasm.__wbindgen_export_2;
        const offset = table.grow(4);
        table.set(0, undefined);
        table.set(offset + 0, undefined);
        table.set(offset + 1, null);
        table.set(offset + 2, true);
        table.set(offset + 3, false);
        ;
    };
    imports.wbg.__wbindgen_is_function = function(arg0) {
        const ret = typeof(arg0) === 'function';
        return ret;
    };
    imports.wbg.__wbindgen_is_object = function(arg0) {
        const val = arg0;
        const ret = typeof(val) === 'object' && val !== null;
        return ret;
    };
    imports.wbg.__wbindgen_is_string = function(arg0) {
        const ret = typeof(arg0) === 'string';
        return ret;
    };
    imports.wbg.__wbindgen_is_undefined = function(arg0) {
        const ret = arg0 === undefined;
        return ret;
    };
    imports.wbg.__wbindgen_memory = function() {
        const ret = wasm.memory;
        return ret;
    };
    imports.wbg.__wbindgen_string_new = function(arg0, arg1) {
        const ret = getStringFromWasm0(arg0, arg1);
        return ret;
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

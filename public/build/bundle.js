
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.38.2' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\Data.svelte generated by Svelte v3.38.2 */

    const { console: console_1$2 } = globals;
    const file$3 = "src\\Data.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[10] = list[i];
    	return child_ctx;
    }

    // (53:12) {#each arr as a}
    function create_each_block$1(ctx) {
    	let tr;
    	let th0;
    	let t0_value = /*arr*/ ctx[1].indexOf(/*a*/ ctx[10]) + 1 + "";
    	let t0;
    	let t1;
    	let th1;
    	let t2_value = /*a*/ ctx[10][0] + "";
    	let t2;
    	let t3;
    	let th2;
    	let t4_value = /*a*/ ctx[10][1] + "";
    	let t4;
    	let t5;
    	let th3;
    	let button;
    	let t7;
    	let mounted;
    	let dispose;

    	function click_handler_1() {
    		return /*click_handler_1*/ ctx[8](/*a*/ ctx[10]);
    	}

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			th0 = element("th");
    			t0 = text(t0_value);
    			t1 = space();
    			th1 = element("th");
    			t2 = text(t2_value);
    			t3 = space();
    			th2 = element("th");
    			t4 = text(t4_value);
    			t5 = space();
    			th3 = element("th");
    			button = element("button");
    			button.textContent = "Delete";
    			t7 = space();
    			add_location(th0, file$3, 54, 16, 1552);
    			add_location(th1, file$3, 55, 16, 1597);
    			add_location(th2, file$3, 56, 16, 1630);
    			attr_dev(button, "id", "clc");
    			add_location(button, file$3, 57, 20, 1667);
    			add_location(th3, file$3, 57, 16, 1663);
    			add_location(tr, file$3, 53, 12, 1530);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, th0);
    			append_dev(th0, t0);
    			append_dev(tr, t1);
    			append_dev(tr, th1);
    			append_dev(th1, t2);
    			append_dev(tr, t3);
    			append_dev(tr, th2);
    			append_dev(th2, t4);
    			append_dev(tr, t5);
    			append_dev(tr, th3);
    			append_dev(th3, button);
    			append_dev(tr, t7);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler_1, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*arr*/ 2 && t0_value !== (t0_value = /*arr*/ ctx[1].indexOf(/*a*/ ctx[10]) + 1 + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*arr*/ 2 && t2_value !== (t2_value = /*a*/ ctx[10][0] + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*arr*/ 2 && t4_value !== (t4_value = /*a*/ ctx[10][1] + "")) set_data_dev(t4, t4_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(53:12) {#each arr as a}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div2;
    	let div1;
    	let h30;
    	let t1;
    	let input;
    	let t2;
    	let h31;
    	let t4;
    	let textarea;
    	let t5;
    	let div0;
    	let button0;
    	let t7;
    	let button1;
    	let t9;
    	let table;
    	let thead;
    	let tr;
    	let th0;
    	let t11;
    	let th1;
    	let t13;
    	let th2;
    	let t15;
    	let th3;
    	let t17;
    	let tbody;
    	let mounted;
    	let dispose;
    	let each_value = /*arr*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div1 = element("div");
    			h30 = element("h3");
    			h30.textContent = "Title";
    			t1 = space();
    			input = element("input");
    			t2 = space();
    			h31 = element("h3");
    			h31.textContent = "Description";
    			t4 = space();
    			textarea = element("textarea");
    			t5 = space();
    			div0 = element("div");
    			button0 = element("button");
    			button0.textContent = "Add Item";
    			t7 = space();
    			button1 = element("button");
    			button1.textContent = "Clear List";
    			t9 = space();
    			table = element("table");
    			thead = element("thead");
    			tr = element("tr");
    			th0 = element("th");
    			th0.textContent = "Sno.";
    			t11 = space();
    			th1 = element("th");
    			th1.textContent = "Title";
    			t13 = space();
    			th2 = element("th");
    			th2.textContent = "Description";
    			t15 = space();
    			th3 = element("th");
    			th3.textContent = "Action";
    			t17 = space();
    			tbody = element("tbody");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(h30, file$3, 30, 8, 733);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "id", "title");
    			attr_dev(input, "placeholder", "");
    			add_location(input, file$3, 31, 8, 757);
    			add_location(h31, file$3, 32, 8, 827);
    			attr_dev(textarea, "type", "text");
    			attr_dev(textarea, "placeholder", "");
    			attr_dev(textarea, "id", "desc");
    			add_location(textarea, file$3, 33, 8, 857);
    			attr_dev(button0, "id", "add");
    			add_location(button0, file$3, 35, 12, 971);
    			attr_dev(button1, "id", "clearstorage");
    			add_location(button1, file$3, 36, 12, 1043);
    			attr_dev(div0, "class", "but");
    			add_location(div0, file$3, 34, 8, 940);
    			attr_dev(div1, "class", "container");
    			add_location(div1, file$3, 29, 4, 700);
    			add_location(th0, file$3, 45, 16, 1308);
    			add_location(th1, file$3, 46, 16, 1339);
    			add_location(th2, file$3, 47, 16, 1371);
    			add_location(th3, file$3, 48, 16, 1409);
    			add_location(tr, file$3, 44, 12, 1286);
    			add_location(thead, file$3, 43, 8, 1265);
    			attr_dev(tbody, "id", "tb");
    			add_location(tbody, file$3, 51, 8, 1471);
    			attr_dev(table, "class", "do-list scroll");
    			add_location(table, file$3, 42, 4, 1225);
    			attr_dev(div2, "class", "data");
    			add_location(div2, file$3, 28, 0, 676);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			append_dev(div1, h30);
    			append_dev(div1, t1);
    			append_dev(div1, input);
    			set_input_value(input, /*t*/ ctx[2]);
    			append_dev(div1, t2);
    			append_dev(div1, h31);
    			append_dev(div1, t4);
    			append_dev(div1, textarea);
    			set_input_value(textarea, /*d*/ ctx[3]);
    			append_dev(div1, t5);
    			append_dev(div1, div0);
    			append_dev(div0, button0);
    			append_dev(div0, t7);
    			append_dev(div0, button1);
    			append_dev(div2, t9);
    			append_dev(div2, table);
    			append_dev(table, thead);
    			append_dev(thead, tr);
    			append_dev(tr, th0);
    			append_dev(tr, t11);
    			append_dev(tr, th1);
    			append_dev(tr, t13);
    			append_dev(tr, th2);
    			append_dev(tr, t15);
    			append_dev(tr, th3);
    			append_dev(table, t17);
    			append_dev(table, tbody);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tbody, null);
    			}

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[5]),
    					listen_dev(textarea, "input", /*textarea_input_handler*/ ctx[6]),
    					listen_dev(
    						button0,
    						"click",
    						function () {
    							if (is_function(/*addData*/ ctx[4](/*t*/ ctx[2], /*d*/ ctx[3]))) /*addData*/ ctx[4](/*t*/ ctx[2], /*d*/ ctx[3]).apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					),
    					listen_dev(button1, "click", /*click_handler*/ ctx[7], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;

    			if (dirty & /*t*/ 4 && input.value !== /*t*/ ctx[2]) {
    				set_input_value(input, /*t*/ ctx[2]);
    			}

    			if (dirty & /*d*/ 8) {
    				set_input_value(textarea, /*d*/ ctx[3]);
    			}

    			if (dirty & /*console, arrStr, localStorage, arr, JSON*/ 3) {
    				each_value = /*arr*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(tbody, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Data", slots, []);
    	let arrStr, str = "";
    	let arr = [];
    	let t, d;

    	function addData(t, d) {
    		console.log("Adding Item");

    		if (localStorage.getItem("items") == null) {
    			arr.push([t, d]);
    			localStorage.setItem("items", JSON.stringify(arr));
    		} else {
    			$$invalidate(0, arrStr = localStorage.getItem("items"));
    			$$invalidate(1, arr = JSON.parse(arrStr));
    			arr.push([t, d]);
    			localStorage.setItem("items", JSON.stringify(arr));
    		}
    	}

    	window.onload = function () {
    		$$invalidate(0, arrStr = localStorage.getItem("items"));
    		$$invalidate(1, arr = JSON.parse(arrStr));
    		localStorage.setItem("items", JSON.stringify(arr));
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$2.warn(`<Data> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		t = this.value;
    		$$invalidate(2, t);
    	}

    	function textarea_input_handler() {
    		d = this.value;
    		$$invalidate(3, d);
    	}

    	const click_handler = () => {
    		console.log("List Cleared");
    		$$invalidate(1, arr = []);
    	};

    	const click_handler_1 = a => {
    		console.log("Task Deleted");
    		$$invalidate(0, arrStr = localStorage.getItem("items"));
    		$$invalidate(1, arr = JSON.parse(arrStr));
    		arr.splice(a[0], 1);
    		localStorage.setItem("items", JSON.stringify(arr));
    	};

    	$$self.$capture_state = () => ({ arrStr, str, arr, t, d, addData });

    	$$self.$inject_state = $$props => {
    		if ("arrStr" in $$props) $$invalidate(0, arrStr = $$props.arrStr);
    		if ("str" in $$props) str = $$props.str;
    		if ("arr" in $$props) $$invalidate(1, arr = $$props.arr);
    		if ("t" in $$props) $$invalidate(2, t = $$props.t);
    		if ("d" in $$props) $$invalidate(3, d = $$props.d);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		arrStr,
    		arr,
    		t,
    		d,
    		addData,
    		input_input_handler,
    		textarea_input_handler,
    		click_handler,
    		click_handler_1
    	];
    }

    class Data extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Data",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src\Footer.svelte generated by Svelte v3.38.2 */

    const file$2 = "src\\Footer.svelte";

    function create_fragment$2(ctx) {
    	let section;
    	let h1;
    	let a0;
    	let t1;
    	let h3;
    	let t3;
    	let div;
    	let a1;
    	let img0;
    	let img0_src_value;
    	let t4;
    	let a2;
    	let img1;
    	let img1_src_value;
    	let t5;
    	let a3;
    	let img2;
    	let img2_src_value;
    	let t6;
    	let p;

    	const block = {
    		c: function create() {
    			section = element("section");
    			h1 = element("h1");
    			a0 = element("a");
    			a0.textContent = "SAGAR";
    			t1 = space();
    			h3 = element("h3");
    			h3.textContent = "Builds your Dream Website";
    			t3 = space();
    			div = element("div");
    			a1 = element("a");
    			img0 = element("img");
    			t4 = space();
    			a2 = element("a");
    			img1 = element("img");
    			t5 = space();
    			a3 = element("a");
    			img2 = element("img");
    			t6 = space();
    			p = element("p");
    			p.textContent = "Copyright @ 2021 SAGAR. All rights reserved.";
    			attr_dev(a0, "href", "https://pinnintisagarsb.github.io/SAGAR/");
    			add_location(a0, file$2, 9, 8, 79);
    			add_location(h1, file$2, 9, 4, 75);
    			add_location(h3, file$2, 10, 4, 150);
    			if (img0.src !== (img0_src_value = "images/instagram.png")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "");
    			add_location(img0, file$2, 12, 20, 238);
    			attr_dev(a1, "href", "#");
    			add_location(a1, file$2, 12, 8, 226);
    			if (img1.src !== (img1_src_value = "images/facebook.png")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "");
    			add_location(img1, file$2, 13, 20, 303);
    			attr_dev(a2, "href", "#");
    			add_location(a2, file$2, 13, 8, 291);
    			if (img2.src !== (img2_src_value = "images/twitter.png")) attr_dev(img2, "src", img2_src_value);
    			attr_dev(img2, "alt", "");
    			add_location(img2, file$2, 14, 20, 367);
    			attr_dev(a3, "href", "#");
    			add_location(a3, file$2, 14, 8, 355);
    			attr_dev(div, "class", "social-icons");
    			add_location(div, file$2, 11, 4, 190);
    			add_location(p, file$2, 16, 4, 426);
    			attr_dev(section, "id", "footer");
    			add_location(section, file$2, 8, 0, 48);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, h1);
    			append_dev(h1, a0);
    			append_dev(section, t1);
    			append_dev(section, h3);
    			append_dev(section, t3);
    			append_dev(section, div);
    			append_dev(div, a1);
    			append_dev(a1, img0);
    			append_dev(div, t4);
    			append_dev(div, a2);
    			append_dev(a2, img1);
    			append_dev(div, t5);
    			append_dev(div, a3);
    			append_dev(a3, img2);
    			append_dev(section, t6);
    			append_dev(section, p);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Footer", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Footer> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Footer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Footer",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src\Quiz.svelte generated by Svelte v3.38.2 */

    const { console: console_1$1 } = globals;
    const file$1 = "src\\Quiz.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[15] = list[i];
    	return child_ctx;
    }

    // (238:8) {:else}
    function create_else_block$1(ctx) {
    	let h3;
    	let t0;
    	let br;
    	let t1;
    	let t2;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			t0 = text("Your Score is");
    			br = element("br");
    			t1 = text(/*score*/ ctx[1]);
    			t2 = space();
    			button = element("button");
    			button.textContent = "Home";
    			attr_dev(br, "class", "svelte-1im8z7y");
    			add_location(br, file$1, 238, 33, 6224);
    			attr_dev(h3, "id", "sc");
    			attr_dev(h3, "class", "svelte-1im8z7y");
    			add_location(h3, file$1, 238, 8, 6199);
    			attr_dev(button, "id", "nxt");
    			attr_dev(button, "class", "svelte-1im8z7y");
    			add_location(button, file$1, 239, 8, 6250);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    			append_dev(h3, t0);
    			append_dev(h3, br);
    			append_dev(h3, t1);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler_3*/ ctx[12], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*score*/ 2) set_data_dev(t1, /*score*/ ctx[1]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(238:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (223:28) 
    function create_if_block_2(ctx) {
    	let each_1_anchor;
    	let each_value = /*ques*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*start, ques, score*/ 35) {
    				each_value = /*ques*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(223:28) ",
    		ctx
    	});

    	return block;
    }

    // (207:8) {#if start ==0}
    function create_if_block$1(ctx) {
    	let input;
    	let t0;
    	let t1;
    	let button;
    	let t2;
    	let mounted;
    	let dispose;
    	let if_block = /*c*/ ctx[4] == 1 && create_if_block_1(ctx);

    	const block = {
    		c: function create() {
    			input = element("input");
    			t0 = space();
    			if (if_block) if_block.c();
    			t1 = space();
    			button = element("button");
    			t2 = text(/*st*/ ctx[2]);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "placeholder", "Enter your Name");
    			attr_dev(input, "id", "name");
    			attr_dev(input, "class", "svelte-1im8z7y");
    			add_location(input, file$1, 207, 8, 5097);
    			attr_dev(button, "id", "start");
    			attr_dev(button, "class", "svelte-1im8z7y");
    			add_location(button, file$1, 211, 8, 5288);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*nm*/ ctx[3]);
    			insert_dev(target, t0, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, button, anchor);
    			append_dev(button, t2);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[8]),
    					listen_dev(button, "click", /*click_handler*/ ctx[9], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*nm*/ 8 && input.value !== /*nm*/ ctx[3]) {
    				set_input_value(input, /*nm*/ ctx[3]);
    			}

    			if (/*c*/ ctx[4] == 1) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_1(ctx);
    					if_block.c();
    					if_block.m(t1.parentNode, t1);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*st*/ 4) set_data_dev(t2, /*st*/ ctx[2]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			if (detaching) detach_dev(t0);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(button);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(207:8) {#if start ==0}",
    		ctx
    	});

    	return block;
    }

    // (224:8) {#each ques as que}
    function create_each_block(ctx) {
    	let div;
    	let p;
    	let t0_value = /*que*/ ctx[15].question + "";
    	let t0;
    	let t1;
    	let button0;
    	let t2_value = /*que*/ ctx[15].correct_answer + "";
    	let t2;
    	let t3;
    	let button1;
    	let t4_value = /*que*/ ctx[15].incorrect_answers[0] + "";
    	let t4;
    	let t5;
    	let button2;
    	let t6_value = /*que*/ ctx[15].incorrect_answers[1] + "";
    	let t6;
    	let t7;
    	let button3;
    	let t8_value = /*que*/ ctx[15].incorrect_answers[2] + "";
    	let t8;
    	let t9;
    	let button4;
    	let t11;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			p = element("p");
    			t0 = text(t0_value);
    			t1 = space();
    			button0 = element("button");
    			t2 = text(t2_value);
    			t3 = space();
    			button1 = element("button");
    			t4 = text(t4_value);
    			t5 = space();
    			button2 = element("button");
    			t6 = text(t6_value);
    			t7 = space();
    			button3 = element("button");
    			t8 = text(t8_value);
    			t9 = space();
    			button4 = element("button");
    			button4.textContent = "End";
    			t11 = space();
    			attr_dev(p, "id", "quest");
    			attr_dev(p, "class", "svelte-1im8z7y");
    			add_location(p, file$1, 225, 12, 5677);
    			attr_dev(button0, "id", "ansr");
    			attr_dev(button0, "class", "svelte-1im8z7y");
    			add_location(button0, file$1, 226, 12, 5723);
    			attr_dev(button1, "id", "ans");
    			attr_dev(button1, "class", "svelte-1im8z7y");
    			add_location(button1, file$1, 229, 12, 5852);
    			attr_dev(button2, "id", "ans");
    			attr_dev(button2, "class", "svelte-1im8z7y");
    			add_location(button2, file$1, 230, 12, 5918);
    			attr_dev(button3, "id", "ans");
    			attr_dev(button3, "class", "svelte-1im8z7y");
    			add_location(button3, file$1, 231, 12, 5984);
    			attr_dev(button4, "id", "nxt");
    			attr_dev(button4, "class", "svelte-1im8z7y");
    			add_location(button4, file$1, 232, 12, 6050);
    			attr_dev(div, "class", "form svelte-1im8z7y");
    			add_location(div, file$1, 224, 8, 5645);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p);
    			append_dev(p, t0);
    			append_dev(div, t1);
    			append_dev(div, button0);
    			append_dev(button0, t2);
    			append_dev(div, t3);
    			append_dev(div, button1);
    			append_dev(button1, t4);
    			append_dev(div, t5);
    			append_dev(div, button2);
    			append_dev(button2, t6);
    			append_dev(div, t7);
    			append_dev(div, button3);
    			append_dev(button3, t8);
    			append_dev(div, t9);
    			append_dev(div, button4);
    			append_dev(div, t11);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler_1*/ ctx[10], false, false, false),
    					listen_dev(button4, "click", /*click_handler_2*/ ctx[11], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*ques*/ 1 && t0_value !== (t0_value = /*que*/ ctx[15].question + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*ques*/ 1 && t2_value !== (t2_value = /*que*/ ctx[15].correct_answer + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*ques*/ 1 && t4_value !== (t4_value = /*que*/ ctx[15].incorrect_answers[0] + "")) set_data_dev(t4, t4_value);
    			if (dirty & /*ques*/ 1 && t6_value !== (t6_value = /*que*/ ctx[15].incorrect_answers[1] + "")) set_data_dev(t6, t6_value);
    			if (dirty & /*ques*/ 1 && t8_value !== (t8_value = /*que*/ ctx[15].incorrect_answers[2] + "")) set_data_dev(t8, t8_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(224:8) {#each ques as que}",
    		ctx
    	});

    	return block;
    }

    // (209:10) {#if c ==1}
    function create_if_block_1(ctx) {
    	let p;
    	let t0;
    	let t1;
    	let t2;
    	let br;
    	let t3;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t0 = text("Welcome ");
    			t1 = text(/*nm*/ ctx[3]);
    			t2 = text("!");
    			br = element("br");
    			t3 = text("Let's Start The Quiz!");
    			attr_dev(br, "class", "svelte-1im8z7y");
    			add_location(br, file$1, 209, 34, 5231);
    			attr_dev(p, "id", "sb");
    			attr_dev(p, "class", "svelte-1im8z7y");
    			add_location(p, file$1, 209, 10, 5207);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t0);
    			append_dev(p, t1);
    			append_dev(p, t2);
    			append_dev(p, br);
    			append_dev(p, t3);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*nm*/ 8) set_data_dev(t1, /*nm*/ ctx[3]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(209:10) {#if c ==1}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let body;
    	let div;
    	let p;
    	let t1;
    	let t2;
    	let footer;
    	let current;

    	function select_block_type(ctx, dirty) {
    		if (/*start*/ ctx[5] == 0) return create_if_block$1;
    		if (/*start*/ ctx[5] == 1) return create_if_block_2;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);
    	footer = new Footer({ $$inline: true });

    	const block = {
    		c: function create() {
    			body = element("body");
    			div = element("div");
    			p = element("p");
    			p.textContent = "Quiz";
    			t1 = space();
    			if_block.c();
    			t2 = space();
    			create_component(footer.$$.fragment);
    			attr_dev(p, "id", "qn");
    			attr_dev(p, "class", "svelte-1im8z7y");
    			add_location(p, file$1, 205, 8, 5043);
    			attr_dev(div, "class", "container container2 svelte-1im8z7y");
    			add_location(div, file$1, 204, 4, 4999);
    			attr_dev(body, "class", "svelte-1im8z7y");
    			add_location(body, file$1, 202, 0, 4981);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, body, anchor);
    			append_dev(body, div);
    			append_dev(div, p);
    			append_dev(div, t1);
    			if_block.m(div, null);
    			append_dev(body, t2);
    			mount_component(footer, body, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(footer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(footer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(body);
    			if_block.d();
    			destroy_component(footer);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Quiz", slots, []);
    	let ques = [];
    	let i = 0;
    	let score = 0;

    	async function startquiz() {
    		await fetch("https://opentdb.com/api.php?amount=15&category=18&difficulty=medium&type=multiple").then(res => {
    			return res.json();
    		}).then(questions => {
    			$$invalidate(0, ques = questions.results);
    			console.log(ques);
    		});
    	}

    	let st = "Enter";
    	let nm;
    	let c = 0;
    	let start = 0;
    	let check = 0;
    	let t = "Enter Your Name";
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$1.warn(`<Quiz> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		nm = this.value;
    		$$invalidate(3, nm);
    	}

    	const click_handler = () => {
    		$$invalidate(4, c = 1);
    		$$invalidate(6, check++, check);
    		$$invalidate(2, st = "Start Quiz");

    		if (check > 1) {
    			startquiz();
    			$$invalidate(5, start = 1);
    			return start;
    		}
    	};

    	const click_handler_1 = () => {
    		$$invalidate(1, score = score + 1);
    	};

    	const click_handler_2 = () => {
    		$$invalidate(5, start = 2);
    	};

    	const click_handler_3 = () => {
    		$$invalidate(5, start = 0);
    	};

    	$$self.$capture_state = () => ({
    		Footer,
    		ques,
    		i,
    		score,
    		startquiz,
    		st,
    		nm,
    		c,
    		start,
    		check,
    		t
    	});

    	$$self.$inject_state = $$props => {
    		if ("ques" in $$props) $$invalidate(0, ques = $$props.ques);
    		if ("i" in $$props) i = $$props.i;
    		if ("score" in $$props) $$invalidate(1, score = $$props.score);
    		if ("st" in $$props) $$invalidate(2, st = $$props.st);
    		if ("nm" in $$props) $$invalidate(3, nm = $$props.nm);
    		if ("c" in $$props) $$invalidate(4, c = $$props.c);
    		if ("start" in $$props) $$invalidate(5, start = $$props.start);
    		if ("check" in $$props) $$invalidate(6, check = $$props.check);
    		if ("t" in $$props) t = $$props.t;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		ques,
    		score,
    		st,
    		nm,
    		c,
    		start,
    		check,
    		startquiz,
    		input_input_handler,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3
    	];
    }

    class Quiz extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Quiz",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.38.2 */

    const { console: console_1 } = globals;
    const file = "src\\App.svelte";

    // (48:1) {:else}
    function create_else_block(ctx) {
    	let quiz;
    	let current;
    	quiz = new Quiz({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(quiz.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(quiz, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(quiz.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(quiz.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(quiz, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(48:1) {:else}",
    		ctx
    	});

    	return block;
    }

    // (42:1) {#if x!=0}
    function create_if_block(ctx) {
    	let div;
    	let p;
    	let t0;
    	let br;
    	let t1;
    	let t2;
    	let data;
    	let t3;
    	let footer;
    	let current;
    	data = new Data({ $$inline: true });
    	footer = new Footer({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			p = element("p");
    			t0 = text(/*dt*/ ctx[1]);
    			br = element("br");
    			t1 = text(/*da*/ ctx[0]);
    			t2 = space();
    			create_component(data.$$.fragment);
    			t3 = space();
    			create_component(footer.$$.fragment);
    			add_location(br, file, 43, 16, 901);
    			attr_dev(p, "id", "t");
    			add_location(p, file, 43, 2, 887);
    			attr_dev(div, "class", "time");
    			add_location(div, file, 42, 1, 866);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p);
    			append_dev(p, t0);
    			append_dev(p, br);
    			append_dev(p, t1);
    			insert_dev(target, t2, anchor);
    			mount_component(data, target, anchor);
    			insert_dev(target, t3, anchor);
    			mount_component(footer, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty & /*dt*/ 2) set_data_dev(t0, /*dt*/ ctx[1]);
    			if (!current || dirty & /*da*/ 1) set_data_dev(t1, /*da*/ ctx[0]);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(data.$$.fragment, local);
    			transition_in(footer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(data.$$.fragment, local);
    			transition_out(footer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching) detach_dev(t2);
    			destroy_component(data, detaching);
    			if (detaching) detach_dev(t3);
    			destroy_component(footer, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(42:1) {#if x!=0}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let body;
    	let div;
    	let h2;
    	let t1;
    	let button;
    	let t2;
    	let t3;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	let mounted;
    	let dispose;
    	const if_block_creators = [create_if_block, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*x*/ ctx[2] != 0) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			body = element("body");
    			div = element("div");
    			h2 = element("h2");
    			h2.textContent = "ToDo's WebList";
    			t1 = space();
    			button = element("button");
    			t2 = text(/*sb*/ ctx[3]);
    			t3 = space();
    			if_block.c();
    			add_location(h2, file, 28, 2, 638);
    			attr_dev(button, "id", "qz");
    			add_location(button, file, 29, 2, 664);
    			attr_dev(div, "class", "top");
    			add_location(div, file, 27, 1, 618);
    			add_location(body, file, 26, 0, 610);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, body, anchor);
    			append_dev(body, div);
    			append_dev(div, h2);
    			append_dev(div, t1);
    			append_dev(div, button);
    			append_dev(button, t2);
    			append_dev(body, t3);
    			if_blocks[current_block_type_index].m(body, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[4], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*sb*/ 8) set_data_dev(t2, /*sb*/ ctx[3]);
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(body, null);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(body);
    			if_blocks[current_block_type_index].d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);

    	let d,
    		da,
    		dt,
    		date,
    		state,
    		arr = {
    			weekday: "long",
    			year: "numeric",
    			month: "long",
    			day: "numeric"
    		};

    	let t = document.getElementById("t");

    	setInterval(
    		function () {
    			d = new Date();
    			date = d.toLocaleDateString(undefined, arr);

    			if (d.getHours() >= 12) {
    				state = "PM";
    			} else {
    				state = "AM";
    			}

    			$$invalidate(0, da = d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds() + " " + state);
    			$$invalidate(1, dt = date);
    		},
    		100
    	);

    	let x = 1;
    	let sb = "Play Quiz";
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => {
    		console.log("clicked");

    		if (x == 1) {
    			$$invalidate(3, sb = "Home");
    			return $$invalidate(2, x = 0);
    		} else {
    			$$invalidate(3, sb = "Play Quiz");
    			return $$invalidate(2, x = 1);
    		}
    	};

    	$$self.$capture_state = () => ({
    		Data,
    		Footer,
    		Quiz,
    		d,
    		da,
    		dt,
    		date,
    		state,
    		arr,
    		t,
    		x,
    		sb
    	});

    	$$self.$inject_state = $$props => {
    		if ("d" in $$props) d = $$props.d;
    		if ("da" in $$props) $$invalidate(0, da = $$props.da);
    		if ("dt" in $$props) $$invalidate(1, dt = $$props.dt);
    		if ("date" in $$props) date = $$props.date;
    		if ("state" in $$props) state = $$props.state;
    		if ("arr" in $$props) arr = $$props.arr;
    		if ("t" in $$props) t = $$props.t;
    		if ("x" in $$props) $$invalidate(2, x = $$props.x);
    		if ("sb" in $$props) $$invalidate(3, sb = $$props.sb);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [da, dt, x, sb, click_handler];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'SB'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map

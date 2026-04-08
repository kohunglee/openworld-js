/**
 * AreaEditor 2.0
 * @github.com/kohunglee/areaEditor
 * @license MIT
 */
(function (global, factory) {
    if (typeof define === 'function' && define.amd) {  // UMD mode
        define([], factory);  // AMD
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();  // CommonJS
    } else {
        global.AreaEditor = factory();
    }
}(this, function () {
    'use strict';

    /**
     * Main constructor
     * @param {HTMLElement|string} Textarea Element or Textarea  Selector
     * @param {Object} Options Configuration Item
     */
    function AreaEditor(element, options = {indentType : { type: 'space', count: 4 }}) {
        if (!(this instanceof AreaEditor)) { return new AreaEditor(element, options); }
        this.element = typeof element === 'string' ? document.querySelectorAll(element) : element;
        this.indentType = options.indentType;
        this.init();
    }

    // Initialization
    AreaEditor.prototype.init = function() {
        for(var _i = 0; _i < this.element.length; _i++){
            if (!this.element[_i]) {
                console.error('AreaEditor: Missing element');
                return;
            }

            if (this.element[_i].tagName !== 'TEXTAREA') {
                console.error('AreaEditor: The element must be a textarea');
                return;
            }

            this.setupEvents(this.element[_i]);
        }
        
    };

    // Set event listener
    AreaEditor.prototype.setupEvents = function(element) {
        element.addEventListener('keydown', this.onKeyDown.bind(this));
        element.addEventListener('input', this.onInput.bind(this));
        element.addEventListener('paste', this.onPaste.bind(this));
        element.addEventListener('keyup', this.onKeyUp.bind(this));
    };
    
    AreaEditor.prototype.isPreventAuto = false;  // Should some auto-scripts be blocked?
    AreaEditor.prototype.isPreventKEY = ['Backspace', 'Delete', 'Meta', 'Control', 'Ctrl'];
    AreaEditor.prototype.beforeEnterScrollTop = 0;

    AreaEditor.prototype.onKeyUp = function(e) {
        if(this.isPreventKEY.includes(e.key)){
            this.isPreventAuto = false;
        }
    }

    AreaEditor.prototype.onPaste = function(e) {
        this.isPreventAuto = true;
    }

    AreaEditor.prototype.onInput = function(e) {
        if(this.isPreventAuto){
            this.isPreventAuto = false;
            return;
        }

        var start = e.target.selectionStart;
        var end = e.target.selectionEnd;
        var value = e.target.value;
        var nextChar = value[start];
        var lastChar = value[start - 1];
        var secondLastChar = value[start - 2];

        // Autocomplete brackets
        var autoPairs = { 
            '{': '}',
            '[': ']',
            '(': ')',
            '"': '"',
            "'": "'",
            '`': '`',
        };
        if (['{', '(', '[', '"', "'", '`', ']', '}', ')'].includes(lastChar) && start === end) {
            if(this.isPreventAuto){
                this.isPreventAuto = false;
                return;
            }
            var pairChar = autoPairs[lastChar]  || '';
            for (var leftBrace in autoPairs) {
                if (leftBrace === secondLastChar && autoPairs[leftBrace] === lastChar && nextChar === lastChar) {  // If the user still chooses to manually complete it, it should be ignored.
                    e.target.value = value.substring(0, start) + value.substring(start + 1);
                    e.target.selectionStart = e.target.selectionEnd = start;
                    return;
                }
            }
            e.target.value = value.substring(0, start) + pairChar + value.substring(start);
            e.target.selectionStart = e.target.selectionEnd = start;
        }

        // Line break processing
        if (lastChar === '\n') {
            var lineStart = value.lastIndexOf('\n', start - 2) + 1;
            var currentLine = value.substring(lineStart, start - 1);
            var indent = currentLine.match(/^\s*/)[0];
            var newText;
            var pairs = {
                '{': '}',
                '[': ']',
                '(': ')',
                '<': '>',
                '>': '<',
            };
            lastChar = currentLine.trim().slice(-1);
            if (pairs[lastChar]) {  // If the current character is open brackets
                if (nextChar === pairs[lastChar]) {  // The next character is closed brackets
                    newText = '\n' + indent + this.tabChar + '\n' + indent;
                } else {
                    newText = '\n' + indent + ((lastChar !== '>') ? (this.tabChar) : '') ;
                }
                e.target.value = value.substring(0, start - 1) + newText + value.substring(end - 1).replace(/\n/, '');
                e.target.selectionStart = e.target.selectionEnd = start - 1 +
                                          indent.length +
                                          ((lastChar !== '>' || nextChar === pairs[lastChar]) ? (1 + this.tabLength) : 1);
            } else {
                newText = '\n' + indent;
                e.target.value = value.substring(0, start - 1) + newText + value.substring(end - 1).replace(/\n/, '');
                e.target.selectionStart = e.target.selectionEnd = start - 1 + newText.length;
            }
            if(this.beforeEnterScrollTop){
                e.target.scrollTop = this.beforeEnterScrollTop;
                this.beforeEnterScrollTop = 0;
            }
            return;
        }

    }

    AreaEditor.prototype.onKeyDown = function(e) {
        var start = e.target.selectionStart;
        var end = e.target.selectionEnd;
        var value = e.target.value;

        this.tabChar = (this.indentType.type === 'tab') ? '\t' : Array(this.indentType.count + 1).join(' ');  // Indented characters
        this.tabLength = this.indentType.count;  // The length of indented characters

        if(this.isPreventKEY.includes(e.key)) {
            this.isPreventAuto = true;
        };

        // TAB
        if (e.key === 'Tab') {
            e.preventDefault();
            if (start === end) {  // No characters are selected in the cursor
                e.target.value = value.substring(0, start) + this.tabChar + value.substring(end);
                e.target.selectionStart = e.target.selectionEnd = start + this.tabLength;
                return;
            } else {
                var contentArr = value.split('\n');
                var contentArrOriginal = value.split('\n');
                var startLine = (value.substring(0, start).match(/\n/g) || []).length;
                var endLine = (value.substring(0, end).match(/\n/g) || []).length;
                if (e.shiftKey) {  // If Shift is pressed (remove indentation)
                    for (var _i = startLine; _i <= endLine; _i++) {
                        contentArr[_i] = this._removeLeadingSpaces(contentArr[_i], this.tabLength);
                    }
                    e.target.value = contentArr.join('\n');
                    var lengthDiff = contentArrOriginal[startLine].length - contentArrOriginal[startLine].trimStart().length; // How many indents are there in the *start* line
                    var moveLength = Math.min(this.tabLength, lengthDiff);
                    var limitLineNum = this._arrSum(contentArr, startLine); // Prevent cursor from deforming after deletion
                    var startPoint = limitLineNum > start - moveLength - startLine ? limitLineNum + startLine : start - moveLength; // If the indented area is selected on the left
                    e.target.selectionStart = lengthDiff > 0 ? startPoint : start;
                    e.target.selectionEnd = end - (contentArrOriginal.join('\n').length - e.target.value.length);
                } else {  // Only the Tab (increase indentation) 
                    for (var _i = startLine; _i <= endLine; _i++) {
                        contentArr[_i] = this.tabChar + contentArr[_i];
                    }
                    e.target.value = contentArr.join('\n');
                    e.target.selectionStart = start + this.tabLength;
                    e.target.selectionEnd = end + this.tabLength * (startLine === endLine ? 1 : endLine - startLine + 1);
                }
            }
        }

        if (e.key === 'Backspace') {
            var contentArr = value.split('\n');
            var startLine = (value.substring(0, start).match(/\n/g) || []).length;
            if(start === end && (/^[\s\t]*$/.test(contentArr[startLine]) && contentArr[startLine] !== '')){  // The current line contains only ' ' and '\t'
                e.target.selectionStart = this._arrSum(contentArr, startLine) + startLine;
                e.target.selectionEnd = start;
            }
        }

        if(e.key === 'Enter'){  // Record scrollbar height, to prevent screen jumping after pressing Enter
            this.beforeEnterScrollTop = e.target.scrollTop;
        }
    };

    // Delete n characters in the indented part of the string
    AreaEditor.prototype._removeLeadingSpaces = function(str, n) {
        var regex = new RegExp("^([ \\t]{0,".concat(n, "})"));
        return str.replace(regex, '');
    };

    // Sum of the lengths of `n` elements before the array
    AreaEditor.prototype._arrSum = function(a, n) {
        var s = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
        return a.slice(0, n).map(function (x) {
            return s += x.length;
        }), s;
    };

    return AreaEditor;
}));
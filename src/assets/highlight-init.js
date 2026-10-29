/*
 * Self-hosted syntax highlighter for blog code blocks.
 * CSP-clean (no external requests), dependency-free, and tuned to the
 * exact languages used across the posts: bash, json, yaml, powershell,
 * python, logscale, and yara. Unknown languages (and "text") are left
 * as plain, readable monospace.
 *
 * Each grammar is an ordered list of { cls, re } rules. Order matters:
 * comments and strings come first so their contents are not re-tokenised
 * as keywords or numbers. Tokenising reads the element's textContent (the
 * decoded original source), so the copy button keeps working unchanged.
 */
(function () {
  'use strict';

  var esc = function (s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  };

  // Shared fragments
  var DQ = '"(?:\\\\.|[^"\\\\])*"'; // double-quoted string with escapes
  var SQ = "'(?:\\\\.|[^'\\\\])*'"; // single-quoted string with escapes
  var SQ_RAW = "'[^']*'"; // single-quoted, no escapes (shell, yaml)

  var grammars = {
    bash: [
      { cls: 'comment', re: '#.*' },
      { cls: 'string', re: DQ },
      { cls: 'string', re: SQ_RAW },
      { cls: 'variable', re: '\\$\\{[^}]+\\}' },
      { cls: 'variable', re: '\\$[A-Za-z_][A-Za-z0-9_]*' },
      { cls: 'variable', re: '\\$[0-9@*#?!$-]' },
      { cls: 'keyword', re: '\\b(?:if|then|else|elif|fi|for|while|until|do|done|case|esac|in|function|return|export|local|source|set|unset|read|eval|exec|trap|shift|declare|readonly)\\b' },
      { cls: 'builtin', re: '\\b(?:echo|printf|cd|pwd|sudo|apt|apt-get|yum|dnf|brew|curl|wget|grep|egrep|awk|sed|cut|tr|cat|tee|sort|uniq|wc|head|tail|xargs|find|chmod|chown|mkdir|rmdir|rm|cp|mv|ln|ls|ps|top|kill|pkill|systemctl|service|journalctl|docker|kubectl|git|ssh|scp|tar|gzip|gunzip|zip|unzip|python3?|pip3?|node|npm|jq|openssl|nc|nmap|dig|nslookup|host|ip|ifconfig|netstat|ss)\\b' },
      { cls: 'attr', re: '(?:^|\\s)-{1,2}[A-Za-z][A-Za-z0-9-]*' },
      { cls: 'number', re: '\\b0x[0-9a-fA-F]+\\b|\\b\\d+\\b' },
      { cls: 'operator', re: '[|&;]{1,2}|[><]{1,2}|&&|\\|\\||`' }
    ],

    json: [
      { cls: 'property', re: '"(?:\\\\.|[^"\\\\])*"(?=\\s*:)' },
      { cls: 'string', re: DQ },
      { cls: 'keyword', re: '\\b(?:true|false|null)\\b' },
      { cls: 'number', re: '-?\\b\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?\\b' },
      { cls: 'operator', re: '[:,]' }
    ],

    yaml: [
      { cls: 'comment', re: '#.*' },
      { cls: 'string', re: DQ },
      { cls: 'string', re: SQ_RAW },
      { cls: 'property', re: '(?:^|\\n)[ \\t]*(?:- )?[A-Za-z0-9_.-]+(?=\\s*:(?:\\s|$))' },
      { cls: 'attr', re: '[&*!][\\w-]+' },
      { cls: 'keyword', re: '\\b(?:true|false|null|yes|no|on|off|~)\\b', i: true },
      { cls: 'number', re: '\\b\\d+(?:\\.\\d+)?\\b' },
      { cls: 'operator', re: '(?:^|\\n)[ \\t]*-(?=\\s)|[:|>]' }
    ],

    powershell: [
      { cls: 'comment', re: '<#[\\s\\S]*?#>|#.*' },
      { cls: 'string', re: '"(?:`.|[^"])*"' },
      { cls: 'string', re: SQ_RAW },
      { cls: 'variable', re: '\\$\\{[^}]+\\}|\\$[A-Za-z_][\\w:]*' },
      { cls: 'keyword', re: '\\b(?:if|else|elseif|foreach|for|while|do|switch|function|filter|param|return|try|catch|finally|throw|begin|process|end|break|continue|class|enum|using|module)\\b', i: true },
      { cls: 'operator', re: '-(?:eq|ne|gt|ge|lt|le|like|notlike|match|notmatch|contains|notcontains|in|notin|and|or|not|xor|band|bor|replace|split|join|is|isnot|as)\\b', i: true },
      { cls: 'function', re: '\\b(?:Get|Set|New|Remove|Add|Clear|Copy|Move|Rename|Import|Export|Invoke|Write|Read|Select|Where|Sort|Group|Measure|ForEach|Out|Format|ConvertTo|ConvertFrom|Test|Start|Stop|Restart|Enable|Disable|Register|Unregister|Connect|Disconnect|Update|Install)-[A-Za-z]\\w*', i: true },
      { cls: 'attr', re: '(?:^|\\s)-[A-Za-z]\\w*' },
      { cls: 'number', re: '\\b0x[0-9a-fA-F]+\\b|\\b\\d+\\b' },
      { cls: 'operator', re: '\\||[+=<>]' }
    ],

    python: [
      { cls: 'comment', re: '#.*' },
      { cls: 'string', re: '[rbfRBF]{0,2}"""[\\s\\S]*?"""' },
      { cls: 'string', re: "[rbfRBF]{0,2}'''[\\s\\S]*?'''" },
      { cls: 'string', re: '[rbfRBF]{0,2}' + DQ },
      { cls: 'string', re: '[rbfRBF]{0,2}' + SQ },
      { cls: 'attr', re: '@[\\w.]+' },
      { cls: 'keyword', re: '\\b(?:def|class|return|if|elif|else|for|while|try|except|finally|with|as|import|from|pass|break|continue|lambda|yield|raise|global|nonlocal|assert|del|in|is|not|and|or|async|await)\\b' },
      { cls: 'keyword', re: '\\b(?:None|True|False)\\b' },
      { cls: 'builtin', re: '\\b(?:print|len|range|dict|list|set|tuple|str|int|float|bool|bytes|open|enumerate|zip|map|filter|sum|min|max|abs|round|sorted|reversed|type|isinstance|getattr|setattr|hasattr|format|repr|super|property|staticmethod|classmethod)\\b' },
      { cls: 'number', re: '\\b0x[0-9a-fA-F]+\\b|\\b\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?\\b' },
      { cls: 'operator', re: '[-+*/%=<>!&|^~]+' }
    ],

    logscale: [
      { cls: 'comment', re: '//.*' },
      { cls: 'string', re: DQ },
      { cls: 'string', re: SQ_RAW },
      { cls: 'function', re: '\\b[A-Za-z_][\\w]*(?=\\s*\\()' },
      { cls: 'keyword', re: '\\b(?:match|in|not|and|or|true|false|case|default|parseJson|format|groupBy|sort|table|head|tail|select|bucket|timeChart|worldMap)\\b' },
      { cls: 'property', re: '[A-Za-z_][\\w.]*(?=\\s*(?:=|!=|=~|<|>|:=))' },
      { cls: 'number', re: '\\b\\d+(?:\\.\\d+)?\\b' },
      { cls: 'operator', re: '\\|=?|:=|=~|!=|[=<>]+' }
    ],

    yara: [
      { cls: 'comment', re: '/\\*[\\s\\S]*?\\*/|//.*' },
      { cls: 'keyword', re: '\\b(?:rule|meta|strings|condition|import|include|private|global|and|not|or|all|any|them|for|of|at|in|matches|contains|icontains|startswith|endswith|filesize|entrypoint|uint8|uint16|uint32|int8|int16|int32|true|false)\\b' },
      { cls: 'variable', re: '[$#@!][A-Za-z0-9_*]*' },
      { cls: 'string', re: DQ },
      { cls: 'string', re: '/(?:\\\\.|[^/\\\\\\n])+/[a-z]*' },
      { cls: 'number', re: '\\b0x[0-9a-fA-F]+\\b|\\b\\d+(?:KB|MB|GB)?\\b' },
      { cls: 'attr', re: '\\{[0-9a-fA-F\\s?\\[\\]()|-]+\\}' },
      { cls: 'operator', re: '[=<>+*&|.~-]+' }
    ]
  };

  // Language aliases → grammar key
  var alias = {
    sh: 'bash', shell: 'bash', zsh: 'bash', console: 'bash',
    ps: 'powershell', ps1: 'powershell', pwsh: 'powershell',
    py: 'python', py3: 'python',
    yml: 'yaml',
    humio: 'logscale', cql: 'logscale'
  };

  function compile(rules) {
    return rules.map(function (r) {
      return { cls: r.cls, re: new RegExp(r.re, 'y' + (r.i ? 'i' : '')) };
    });
  }
  var compiled = {};

  function tokenize(code, rules) {
    var out = '';
    var i = 0;
    var n = code.length;
    while (i < n) {
      var matched = false;
      for (var r = 0; r < rules.length; r++) {
        var rule = rules[r];
        rule.re.lastIndex = i;
        var m = rule.re.exec(code);
        if (m && m[0] && m.index === i) {
          out += '<span class="tok-' + rule.cls + '">' + esc(m[0]) + '</span>';
          i += m[0].length;
          matched = true;
          break;
        }
      }
      if (!matched) {
        out += esc(code.charAt(i));
        i += 1;
      }
    }
    return out;
  }

  function langOf(codeEl) {
    var cls = codeEl.className || '';
    var m = /language-([\w+-]+)/.exec(cls);
    if (!m) return null;
    var lang = m[1].toLowerCase();
    return alias[lang] || lang;
  }

  function highlightAll(root) {
    var nodes = (root || document).querySelectorAll('.terminal-block pre code:not([data-hl])');
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      el.setAttribute('data-hl', '1');
      var lang = langOf(el);
      if (!lang || !grammars[lang]) continue; // text / unknown → leave plain
      if (!compiled[lang]) compiled[lang] = compile(grammars[lang]);
      try {
        var source = el.textContent;
        el.innerHTML = tokenize(source, compiled[lang]);
      } catch (e) {
        /* leave the block as plain text on any failure */
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { highlightAll(); });
  } else {
    highlightAll();
  }
})();

// Terminal System mit Filesystem
import filesystem from './filesystem.js';

class Terminal {
    constructor() {
        this.terminal = document.getElementById('terminal');
        this.input = document.getElementById('terminal-input');
        this.output = document.getElementById('terminal-output');
        this.hint = document.querySelector('.terminal-hint');

        // Filesystem State
        this.currentPath = '/';
        this.commandHistory = [];
        this.historyIndex = -1;

        this.init();
    }

    init() {
        // Keyboard Events
        document.addEventListener('keydown', (e) => {
            // Ctrl+K für Toggle
            if (e.ctrlKey && e.key === 'k') {
                e.preventDefault();
                this.toggle();
            }

            // ESC zum Schließen
            if (e.key === 'Escape' && this.isActive()) {
                this.close();
            }
        });

        // Input Events
        this.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.handleCommand();
            }

            // Command History mit Pfeiltasten
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.navigateHistory('up');
            }

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.navigateHistory('down');
            }
        });

        // Close Button
        const closeBtn = document.querySelector('.terminal__btn--close');
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.close();
        });

        // Click außerhalb schließt Terminal
        this.terminal.addEventListener('click', (e) => {
            if (e.target === this.terminal) {
                this.close();
            }
        });

        // Hint klickbar machen
        if (this.hint) {
            this.hint.addEventListener('click', () => {
                this.open();
            });
        }
    }

    // Command Handler
    handleCommand() {
        const command = this.input.value.trim();
        if (!command) return;

        // Command zur History hinzufügen
        this.commandHistory.push(command);
        this.historyIndex = this.commandHistory.length;

        // Command + Prompt ausgeben
        this.addOutput(`<span class="terminal__prompt">jan@portfolio ${this.getPromptPath()} %</span> ${command}`);

        // Command parsen und ausführen
        this.executeCommand(command);

        // Input leeren
        this.input.value = '';

        // Scroll to bottom
        this.output.scrollTop = this.output.scrollHeight;
    }

    // Command History Navigation
    navigateHistory(direction) {
        if (direction === 'up' && this.historyIndex > 0) {
            this.historyIndex--;
            this.input.value = this.commandHistory[this.historyIndex];
        } else if (direction === 'down') {
            this.historyIndex++;
            if (this.historyIndex >= this.commandHistory.length) {
                this.historyIndex = this.commandHistory.length;
                this.input.value = '';
            } else {
                this.input.value = this.commandHistory[this.historyIndex];
            }
        }
    }

    // Command Execution
    executeCommand(input) {
        const parts = input.split(' ');
        const cmd = parts[0].toLowerCase();
        const args = parts.slice(1);

        switch(cmd) {
            case 'help':
                this.cmdHelp();
                break;
            case 'clear':
                this.cmdClear();
                break;
            case 'ls':
                this.cmdLs(args);
                break;
            case 'cd':
                this.cmdCd(args);
                break;
            case 'pwd':
                this.cmdPwd();
                break;
            case 'cat':
                this.cmdCat(args);
                break;
            case 'exit':
                this.close();
                break;
            case 'about':
                this.cmdAbout();
                break;
            case 'projects':
                this.cmdProjects();
                break;
            case 'contact':
                this.cmdContact();
                break;
            case 'whoami':
                this.cmdWhoami();
                break;
            default:
                this.addOutput(`Command not found: ${cmd}. Type 'help' for available commands.`);
        }
    }

    // Commands Implementation
    cmdHelp() {
        this.addOutput(`
Available Commands:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Navigation:
  ls [path]         List directory contents
  cd &ltpath&gt         Change directory
  pwd               Print working directory
  cat &ltfile&gt        Display file contents

Quick Access:
  about             About me
  projects          List all projects
  contact           Contact information

System:
  help              Show this help
  clear             Clear terminal
  exit              Close terminal
  whoami            Who am I?

Tips:
  • Use Tab for autocomplete (coming soon)
  • Use ↑/↓ for command history
  • Try 'cd projects' and explore!
        `);
    }

    cmdClear() {
        this.output.innerHTML = '';
    }

    cmdLs(args) {
        const path = args[0] || this.currentPath;
        const targetPath = this.resolvePath(path);
        const node = this.getNode(targetPath);

        if (!node) {
            this.addOutput(`ls: ${path}: No such file or directory`);
            return;
        }

        if (node.type !== 'dir') {
            this.addOutput(path);
            return;
        }

        const items = Object.keys(node.content).map(name => {
            const item = node.content[name];
            return item.type === 'dir' ? `${name}/` : name;
        });

        if (items.length === 0) {
            this.addOutput('(empty directory)');
        } else {
            this.addOutput(items.join('  '));
        }
    }

    cmdCd(args) {
        if (args.length === 0 || args[0] === '~') {
            this.currentPath = '/';
            this.updatePrompt();
            return;
        }

        const targetPath = this.resolvePath(args[0]);
        const node = this.getNode(targetPath);

        if (!node) {
            this.addOutput(`cd: ${args[0]}: No such file or directory`);
            return;
        }

        if (node.type !== 'dir') {
            this.addOutput(`cd: ${args[0]}: Not a directory`);
            return;
        }

        this.currentPath = targetPath;
        this.updatePrompt();
    }

    cmdPwd() {
        this.addOutput(this.currentPath === '/' ? '~' : `~${this.currentPath}`);
    }

    cmdCat(args) {
        if (args.length === 0) {
            this.addOutput('cat: missing file operand');
            return;
        }

        const targetPath = this.resolvePath(args[0]);
        const node = this.getNode(targetPath);

        if (!node) {
            this.addOutput(`cat: ${args[0]}: No such file or directory`);
            return;
        }

        if (node.type !== 'file') {
            this.addOutput(`cat: ${args[0]}: Is a directory`);
            return;
        }

        this.addOutput(node.content);
    }

    cmdAbout() {
        this.addOutput(`
Jan Vogt - Informatikstudent & Developer
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

B.Sc. Informatik @ FSU Jena
Fußball-Schiedsrichter Thüringen
Redaktionsmitglied "Die Wurzel"

Try: cd about && ls
        `);
    }

    cmdProjects() {
        this.addOutput(`
My Projects:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📡 SatTrak          3D Satellite Visualization
⚡ SolarFlow        Smart Energy Management
⚔️  Cryptborne       3D Dungeon Crawler (WIP)

Try: cd projects && ls
Or:  cd projects/SatTrak && cat readme.md
        `);
    }

    cmdContact() {
        this.addOutput(`
Contact Information:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📧 jan.vogt.portfolio@web.de
🐙 github.com/JanVogt06
📷 instagram.com/jan.vogt06
📍 Bad Berka, Thüringen

Try: cd contact && ls
        `);
    }

    cmdWhoami() {
        this.addOutput('jan');
    }

    // Filesystem Helpers
    resolvePath(path) {
        if (path === '~' || path === '') return '/';
        if (path.startsWith('/')) return path;
        if (path.startsWith('~/')) return path.substring(1);

        // Relative path
        if (path === '.') return this.currentPath;
        if (path === '..') {
            return this.currentPath.split('/').slice(0, -1).join('/') || '/';
        }

        // Handle ../
        let parts = this.currentPath.split('/').filter(p => p);
        const pathParts = path.split('/');

        for (const part of pathParts) {
            if (part === '..') {
                parts.pop();
            } else if (part !== '.' && part !== '') {
                parts.push(part);
            }
        }

        return '/' + parts.join('/');
    }

    getNode(path) {
        if (path === '/' || path === '') return filesystem['/'];

        const parts = path.split('/').filter(p => p);
        let current = filesystem['/'];

        for (const part of parts) {
            if (!current.content || !current.content[part]) {
                return null;
            }
            current = current.content[part];
        }

        return current;
    }

    getPromptPath() {
        return this.currentPath === '/' ? '~' : `~${this.currentPath}`;
    }

    updatePrompt() {
        const prompt = document.querySelector('.terminal__input-line .terminal__prompt');
        if (prompt) {
            prompt.textContent = `jan@portfolio ${this.getPromptPath()} %`;
        }
    }

    // Output Helper
    addOutput(text) {
        const line = document.createElement('div');
        line.className = 'terminal__line';
        line.innerHTML = text;
        this.output.appendChild(line);
    }

    // Terminal Controls
    toggle() {
        if (this.isActive()) {
            this.close();
        } else {
            this.open();
        }
    }

    open() {
        this.terminal.classList.remove('terminal--closing');
        this.terminal.classList.add('terminal--active');
        this.input.focus();

        if (this.hint) {
            this.hint.classList.add('terminal-hint--hidden');
        }
    }

    close() {
        this.terminal.classList.add('terminal--closing');

        setTimeout(() => {
            this.terminal.classList.remove('terminal--active');
            this.terminal.classList.remove('terminal--closing');

            if (this.hint) {
                this.hint.classList.remove('terminal-hint--hidden');
            }
        }, 250);
    }

    isActive() {
        return this.terminal.classList.contains('terminal--active');
    }
}

// Terminal initialisieren
document.addEventListener('DOMContentLoaded', () => {
    new Terminal();
});
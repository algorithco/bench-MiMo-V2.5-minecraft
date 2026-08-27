(function () {
  "use strict";

  window.VoxelGame = window.VoxelGame || {};

  function ChatSystem() {
    this.isOpen = false;
    this.messages = [];
    this.maxMessages = 100;
    this.commandHistory = [];
    this.historyIndex = -1;
    this.container = null;
    this.messagesEl = null;
    this.inputEl = null;
    this.init();
  }

  ChatSystem.prototype.init = function () {
    var style = document.createElement("style");
    style.id = "chat-styles";
    style.textContent =
      ".chat-container{position:fixed;bottom:80px;left:10px;width:400px;pointer-events:none;z-index:1001;font-family:'Courier New',monospace;}" +
      ".chat-messages{max-height:200px;overflow-y:auto;margin-bottom:5px;}" +
      ".chat-message{color:#fff;font-size:13px;padding:2px 6px;text-shadow:1px 1px #000;margin-bottom:2px;line-height:1.4;word-wrap:break-word;}" +
      ".chat-message.chat{color:#fff;}" +
      ".chat-message.system{color:#aaa;}" +
      ".chat-message.error{color:#e74c3c;}" +
      ".chat-message.success{color:#2ecc71;}" +
      ".chat-message.command{color:#3498db;}" +
      ".chat-input-container{display:none;pointer-events:auto;}" +
      ".chat-input{width:100%;background:rgba(0,0,0,0.7);color:#fff;border:1px solid #555;padding:6px 10px;font-size:13px;font-family:'Courier New',monospace;outline:none;border-radius:3px;}" +
      ".chat-input:focus{border-color:#fff;}";
    document.head.appendChild(style);

    this.container = document.createElement("div");
    this.container.className = "chat-container";
    this.container.id = "chat-system";

    this.messagesEl = document.createElement("div");
    this.messagesEl.className = "chat-messages";
    this.container.appendChild(this.messagesEl);

    var inputContainer = document.createElement("div");
    inputContainer.className = "chat-input-container";
    inputContainer.id = "chat-input-container";

    this.inputEl = document.createElement("input");
    this.inputEl.className = "chat-input";
    this.inputEl.type = "text";
    this.inputEl.placeholder = "Type a message or /command...";
    this.inputEl.maxLength = 200;
    inputContainer.appendChild(this.inputEl);

    this.container.appendChild(inputContainer);
    document.body.appendChild(this.container);

    this.inputEl.addEventListener("keydown", this.onKeyDown.bind(this));

    this.add("Welcome! Press T to chat. Type /help for commands.", "system");
  };

  ChatSystem.prototype.onKeyDown = function (e) {
    if (e.key === "Enter") {
      var text = this.inputEl.value.trim();
      if (text.length > 0) {
        this.send(text);
        this.commandHistory.push(text);
        this.historyIndex = this.commandHistory.length;
      }
      this.inputEl.value = "";
      this.toggle();
    } else if (e.key === "Escape") {
      this.inputEl.value = "";
      this.toggle();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (this.historyIndex > 0) {
        this.historyIndex--;
        this.inputEl.value = this.commandHistory[this.historyIndex] || "";
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (this.historyIndex < this.commandHistory.length - 1) {
        this.historyIndex++;
        this.inputEl.value = this.commandHistory[this.historyIndex] || "";
      } else {
        this.historyIndex = this.commandHistory.length;
        this.inputEl.value = "";
      }
    }
  };

  ChatSystem.prototype.toggle = function () {
    this.isOpen = !this.isOpen;
    var inputContainer = document.getElementById("chat-input-container");
    if (this.isOpen) {
      inputContainer.style.display = "block";
      this.inputEl.focus();
    } else {
      inputContainer.style.display = "none";
      this.inputEl.blur();
    }
  };

  ChatSystem.prototype.add = function (msg, type) {
    type = type || "chat";
    var el = document.createElement("div");
    el.className = "chat-message " + type;
    el.textContent = msg;
    this.messagesEl.appendChild(el);

    this.messages.push({ text: msg, type: type, element: el });

    while (this.messages.length > this.maxMessages) {
      var old = this.messages.shift();
      if (old.element.parentNode) {
        old.element.parentNode.removeChild(old.element);
      }
    }

    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;

    el.style.opacity = "0";
    el.style.transition = "opacity 0.15s";
    setTimeout(function () {
      el.style.opacity = "1";
    }, 10);
  };

  ChatSystem.prototype.send = function (text) {
    if (text.charAt(0) === "/") {
      this.executeCommand(text.substring(1));
    } else {
      this.add("<Player> " + text, "chat");
    }
  };

  ChatSystem.prototype.executeCommand = function (cmd) {
    var parts = cmd.trim().split(/\s+/);
    var command = parts[0].toLowerCase();
    var args = parts.slice(1);

    switch (command) {
      case "gamemode":
        var mode = args[0] || "survival";
        this.add("Game mode set to " + mode, "success");
        break;

      case "time":
        var timeVal = args[0] || "day";
        var timeNum = parseInt(timeVal, 10);
        if (!isNaN(timeNum)) {
          window.VoxelGame.Sky.setTime(timeNum / 24000);
          this.add("Time set to " + timeNum, "success");
        } else {
          var timeMap = { day: 0.25, night: 0.75, dawn: 0.0, dusk: 0.5, noon: 0.25, midnight: 0.75 };
          var mapped = timeMap[timeVal.toLowerCase()];
          if (mapped !== undefined) {
            window.VoxelGame.Sky.setTime(mapped);
            this.add("Time set to " + timeVal, "success");
          } else {
            this.add("Usage: /time <day|night|dawn|dusk|number>", "error");
          }
        }
        break;

      case "tp":
        if (args.length < 3) {
          this.add("Usage: /tp <x> <y> <z>", "error");
        } else {
          var x = parseFloat(args[0]);
          var y = parseFloat(args[1]);
          var z = parseFloat(args[2]);
          if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
            this.add("Teleported to " + x + " " + y + " " + z, "success");
            if (window.VoxelGame.Player && window.VoxelGame.Player.setPosition) {
              window.VoxelGame.Player.setPosition(x, y, z);
            }
          } else {
            this.add("Invalid coordinates", "error");
          }
        }
        break;

      case "fly":
        var flyState = args[0] || "on";
        this.add("Fly mode " + flyState, "success");
        break;

      case "seed":
        var seed = Math.floor(Math.random() * 2147483647);
        this.add("Seed: " + seed, "command");
        break;

      case "clear":
        this.messagesEl.innerHTML = "";
        this.messages = [];
        this.add("Chat cleared", "system");
        break;

      case "help":
        this.add("=== Commands ===", "command");
        this.add("/gamemode <mode> - Set game mode", "command");
        this.add("/time <day|night|dawn|dusk|number> - Set time", "command");
        this.add("/tp <x> <y> <z> - Teleport", "command");
        this.add("/fly <on|off> - Toggle fly mode", "command");
        this.add("/seed - Show world seed", "command");
        this.add("/clear - Clear chat", "command");
        this.add("/help - Show this help", "command");
        break;

      default:
        this.add("Unknown command: /" + command + ". Type /help for commands.", "error");
        break;
    }
  };

  ChatSystem.prototype.clear = function () {
    this.messagesEl.innerHTML = "";
    this.messages = [];
  };

  ChatSystem.prototype.getIsOpen = function () {
    return this.isOpen;
  };

  window.VoxelGame.Chat = {
    ChatSystem: ChatSystem
  };
})();

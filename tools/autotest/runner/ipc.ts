/**
 * IPC - Electron IPC bridge between Playwright runner and Vue frontend
 *
 * Provides bidirectional communication for test execution control and event broadcasting.
 * In Electron mode, runner is imported as a module and communicates via EventEmitter.
 */

import { EventEmitter } from 'events';
import type { RunnerEvent, ControlMessage } from './types.js';

/**
 * Electron IPC interface (provided by main process when running in Electron)
 */
interface ElectronIPC {
  send: (channel: string, data: any) => void;
  invoke: (channel: string, ...args: any[]) => Promise<any>;
}

/**
 * IPC Manager for runner-to-frontend communication
 */
export class IpcManager extends EventEmitter {
  private controlHandler: ((msg: ControlMessage) => void) | null = null;
  private electronIPC: ElectronIPC | null = null;

  /**
   * Initialize IPC for Electron mode
   */
  initElectron(electronIPC: ElectronIPC): void {
    this.electronIPC = electronIPC;
    
    // Listen for control messages from main process
    if (typeof process !== 'undefined' && process.send) {
      process.on('message', (msg: any) => {
        if (msg.type === 'control' && this.controlHandler) {
          this.controlHandler(msg.data as ControlMessage);
        }
      });
    }
  }

  /**
   * Register a handler for incoming control messages
   */
  onControl(handler: (msg: ControlMessage) => void): void {
    this.controlHandler = handler;
  }

  /**
   * Send an event to the frontend
   */
  send(event: RunnerEvent): void {
    // Send via Electron IPC if available
    if (this.electronIPC) {
      this.electronIPC.send('runner-event', event);
    }
    
    // Also emit locally for any local listeners
    this.emit('runner-event', event);
    
    // Send via process.parentPort for Electron utility process
    if (typeof process !== 'undefined' && process.send) {
      process.send({ type: 'runner-event', data: event });
    }
  }

  /**
   * Send a log message
   */
  log(level: 'info' | 'warn' | 'error', message: string): void {
    this.send({ type: 'log', level, message });
  }
}

/**
 * Singleton instance
 */
export const ipcServer = new IpcManager();

/**
 * Create IPC interface for use in Electron main process
 */
export function createElectronIPC(mainWindow: any) {
  return {
    send: (channel: string, data: any) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send(channel, data);
      }
    },
    invoke: async (channel: string, ...args: any[]) => {
      // Handle invocations from runner
      return null;
    }
  };
}

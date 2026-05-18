import { useRef, useState, useEffect } from 'react';
import { PrinterService } from '../services/printerService';

export function usePrinter() {
  const service = useRef(new PrinterService());
  const [connected, setConnected] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const svc = service.current;
    svc.tryAutoConnect().then(ok => {
      if (ok) setConnected(true);
    });
    return () => {
      svc.disconnect().catch(() => {});
    };
  }, []);

  const connect = async () => {
    setError(null);
    try {
      await service.current.connect();
      setConnected(true);
    } catch (e) {
      setError(e.message);
      setConnected(false);
    }
  };

  const disconnect = async () => {
    await service.current.disconnect();
    setConnected(false);
  };

  const printReceipt = async (sale, biz) => {
    setPrinting(true);
    setError(null);
    try {
      await service.current.printReceipt(sale, biz);
    } catch (e) {
      setError(e.message);
      if (!service.current.isConnected()) setConnected(false);
      throw e;
    } finally {
      setPrinting(false);
    }
  };

  return {
    connected,
    printing,
    error,
    connect,
    disconnect,
    printReceipt,
    isSupported: service.current.isSupported(),
  };
}

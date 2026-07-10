import jsrp from 'jsrp';

export const generateSrpServerKey = async (
  salt: string,
  verifier: string,
): Promise<{ pubKey: string; privateKey: string }> => {
  const server = new jsrp.server();

  await new Promise<void>((resolve) => {
    server.init({ salt, verifier }, () => {
      resolve();
    });
  });

  return {
    pubKey: server.getPublicKey(),
    privateKey: server.getPrivateKey(),
  };
};

export const verifySrpClientProof = async (
  salt: string,
  verifier: string,
  serverPrivateKey: string,
  clientPublicKey: string,
  clientProof: string,
): Promise<boolean> => {
  const server = new jsrp.server();

  await new Promise<void>((resolve) => {
    server.init({ salt, verifier, b: serverPrivateKey }, () => {
      resolve();
    });
  });

  server.setClientPublicKey(clientPublicKey);

  return server.checkClientProof(clientProof);
};

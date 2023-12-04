import {
  ed25519,
  edwardsToMontgomeryPub,
  edwardsToMontgomeryPriv,
} from "@noble/curves/ed25519"
import {
  DIDResolver,
  DIDDoc,
  SecretsResolver,
  Secret,
  Message,
  UnpackMetadata,
  PackEncryptedMetadata,
  MessagingServiceMetadata,
  IMessage,
} from "didcomm"
import DIDPeer from "./peer2"
import { v4 as uuidv4 } from "uuid"
import logger from "./logger"

export type DID = string

function x25519ToSecret(
  did: DID,
  x25519KeyPriv: Uint8Array,
  x25519Key: Uint8Array
): Secret {
  const encIdent = DIDPeer.keyToIdent(x25519Key, "x25519-pub")
  const secretEnc: Secret = {
    id: `${did}#${encIdent}`,
    type: "X25519KeyAgreementKey2020",
    privateKeyMultibase: DIDPeer.keyToMultibase(x25519KeyPriv, "x25519-priv"),
  }
  return secretEnc
}

function ed25519ToSecret(
  did: DID,
  ed25519KeyPriv: Uint8Array,
  ed25519Key: Uint8Array
): Secret {
  const verIdent = DIDPeer.keyToIdent(ed25519Key, "ed25519-pub")
  const secretVer: Secret = {
    id: `${did}#${verIdent}`,
    type: "Ed25519VerificationKey2020",
    privateKeyMultibase: DIDPeer.keyToMultibase(ed25519KeyPriv, "ed25519-priv"),
  }
  return secretVer
}

export function generateDidForMediator() {
  const key = ed25519.utils.randomPrivateKey()
  const enckeyPriv = edwardsToMontgomeryPriv(key)
  const verkey = ed25519.getPublicKey(key)
  const enckey = edwardsToMontgomeryPub(verkey)
  const service = {
    type: "DIDCommMessaging",
    serviceEndpoint: "",
    accept: ["didcomm/v2"],
  }
  const did = DIDPeer.generate([verkey], [enckey], service)

  const secretVer = ed25519ToSecret(did, key, verkey)
  const secretEnc = x25519ToSecret(did, enckeyPriv, enckey)
  return { did, secrets: [secretVer, secretEnc] }
}

export function generateDid(routingDid: DID) {
  const key = ed25519.utils.randomPrivateKey()
  const enckeyPriv = edwardsToMontgomeryPriv(key)
  const verkey = ed25519.getPublicKey(key)
  const enckey = edwardsToMontgomeryPub(verkey)
  const service = {
    type: "DIDCommMessaging",
    serviceEndpoint: {
      uri: routingDid,
      accept: ["didcomm/v2"],
    },
  }
  const did = DIDPeer.generate([verkey], [enckey], service)

  const secretVer = ed25519ToSecret(did, key, verkey)
  const secretEnc = x25519ToSecret(did, enckeyPriv, enckey)
  return { did, secrets: [secretVer, secretEnc] }
}

export class DIDPeerResolver implements DIDResolver {
  async resolve(did: DID): Promise<DIDDoc | null> {
    const raw_doc = DIDPeer.resolve(did)
    return {
      id: raw_doc.id,
      verificationMethod: raw_doc.verificationMethod,
      authentication: raw_doc.authentication,
      keyAgreement: raw_doc.keyAgreement,
      service: raw_doc.service,
    }
  }
}

export interface SecretsManager extends SecretsResolver {
  store_secret: (secret: Secret) => void
}

export class LocalSecretsResolver implements SecretsManager {
  private readonly storageKey = "secretsResolver"

  constructor() {
    // Initialize local storage if it hasn't been done before
    if (!localStorage.getItem(this.storageKey)) {
      localStorage.setItem(this.storageKey, JSON.stringify({}))
    }
  }

  private static createError(message: string, name: string): Error {
    const e = new Error(message)
    e.name = name
    return e
  }

  async get_secret(secret_id: string): Promise<Secret | null> {
    try {
      const secrets = JSON.parse(localStorage.getItem(this.storageKey) || "{}")
      return secrets[secret_id] || null
    } catch (error) {
      throw LocalSecretsResolver.createError(
        "Unable to perform IO operation",
        "DIDCommIoError"
      )
    }
  }

  async find_secrets(secret_ids: Array<string>): Promise<Array<string>> {
    try {
      const secrets = JSON.parse(localStorage.getItem(this.storageKey) || "{}")
      return secret_ids.map(id => secrets[id]).filter(secret => !!secret) // Filter out undefined or null values
    } catch (error) {
      throw LocalSecretsResolver.createError(
        "Unable to perform IO operation",
        "DIDCommIoError"
      )
    }
  }

  // Helper method to store a secret in localStorage
  store_secret(secret: Secret): void {
    try {
      const secrets = JSON.parse(localStorage.getItem(this.storageKey) || "{}")
      secrets[secret.id] = secret
      localStorage.setItem(this.storageKey, JSON.stringify(secrets))
    } catch (error) {
      throw LocalSecretsResolver.createError(
        "Unable to perform IO operation",
        "DIDCommIoError"
      )
    }
  }
}

export class EphemeralSecretsResolver implements SecretsManager {
  private secrets: Record<string, Secret> = {}

  private static createError(message: string, name: string): Error {
    const e = new Error(message)
    e.name = name
    return e
  }

  async get_secret(secret_id: string): Promise<Secret | null> {
    try {
      return this.secrets[secret_id] || null
    } catch (error) {
      throw EphemeralSecretsResolver.createError(
        "Unable to fetch secret from memory",
        "DIDCommMemoryError"
      )
    }
  }

  async find_secrets(secret_ids: Array<string>): Promise<Array<string>> {
    try {
      return secret_ids
        .map(id => this.secrets[id])
        .filter(secret => !!secret)
        .map(secret => secret.id) // Filter out undefined or null values
    } catch (error) {
      throw EphemeralSecretsResolver.createError(
        "Unable to fetch secrets from memory",
        "DIDCommMemoryError"
      )
    }
  }

  // Helper method to store a secret in memory
  store_secret(secret: Secret): void {
    try {
      this.secrets[secret.id] = secret
    } catch (error) {
      throw EphemeralSecretsResolver.createError(
        "Unable to store secret in memory",
        "DIDCommMemoryError"
      )
    }
  }
}

export interface DIDCommMessage {
  type: string
  body?: any
  [key: string]: any
}

export class DIDComm {
  private readonly resolver: DIDPeerResolver
  private readonly secretsResolver: SecretsManager

  constructor() {
    this.resolver = new DIDPeerResolver()
    this.secretsResolver = new EphemeralSecretsResolver()
  }

  async generateDidForMediator(): Promise<DID> {
    const { did, secrets } = generateDidForMediator()
    secrets.forEach(secret => this.secretsResolver.store_secret(secret))
    return did
  }

  async generateDid(routingDid: DID): Promise<DID> {
    const { did, secrets } = generateDid(routingDid)
    secrets.forEach(secret => this.secretsResolver.store_secret(secret))
    return did
  }

  async resolve(did: DID): Promise<DIDDoc | null> {
    return await this.resolver.resolve(did)
  }

  async resolveDIDCommServices(did: DID): Promise<any> {
    const doc = await this.resolve(did)
    if (!doc) {
      throw new Error("Unable to resolve DID")
    }
    if (!doc.service) {
      throw new Error("No service found")
    }

    const services = doc.service
      .filter(s => s.type === "DIDCommMessaging")
      .filter(s => s.serviceEndpoint.accept.includes("didcomm/v2"))
    return services
  }

  /**
   * Obtain the first websocket endpoint for a given DID.
   *
   * @param {DID} did The DID to obtain the websocket endpoint for
   */
  async wsEndpoint(did: DID): Promise<MessagingServiceMetadata> {
    const services = await this.resolveDIDCommServices(did)

    const service = services.filter((s: any) =>
      s.serviceEndpoint.uri.startsWith("ws")
    )[0]
    return {
      id: service.id,
      service_endpoint: service.serviceEndpoint.uri,
    }
  }

  /**
   * Obtain the first http endpoint for a given DID.
   *
   * @param {DID} did The DID to obtain the websocket endpoint for
   */
  async httpEndpoint(did: DID): Promise<MessagingServiceMetadata> {
    const services = await this.resolveDIDCommServices(did)
    const service = services.filter((s: any) =>
      s.serviceEndpoint.uri.startsWith("http")
    )[0]
    return {
      id: service.id,
      service_endpoint: service.serviceEndpoint.uri,
    }
  }

  async prepareMessage(
    to: DID,
    from: DID,
    message: DIDCommMessage
  ): Promise<[IMessage, string, PackEncryptedMetadata]> {
    const msg = new Message({
      id: uuidv4(),
      typ: "application/didcomm-plain+json",
      from: from,
      to: [to],
      body: message.body || {},
      created_time: Date.now(),
      ...message,
    })
    const [packed, meta] = await msg.pack_encrypted(
      to,
      from,
      null,
      this.resolver,
      this.secretsResolver,
      { forward: true }
    )
    if (!meta.messaging_service) {
      meta.messaging_service = await this.httpEndpoint(to)
    }
    return [msg.as_value(), packed, meta]
  }

  async unpackMessage(message: string): Promise<[Message, UnpackMetadata]> {
    return await Message.unpack(
      message,
      this.resolver,
      this.secretsResolver,
      {}
    )
  }

  async sendMessageAndExpectReply(
    to: DID,
    from: DID,
    message: DIDCommMessage
  ): Promise<[Message, UnpackMetadata]> {
    const [plaintext, packed, meta] = await this.prepareMessage(
      to,
      from,
      message
    )
    logger.sentMessage({ to, from, message: plaintext })
    if (!meta.messaging_service) {
      throw new Error("No messaging service found")
    }

    try {
      const response = await fetch(meta.messaging_service.service_endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/didcomm-encrypted+json",
        },
        body: packed,
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(`Error sending message: ${text}`)
      }
      logger.log("Message sent successfully.")

      const packedResponse = await response.text()
      const unpacked = await this.unpackMessage(packedResponse)

      logger.recvMessage({ to, from, message: unpacked[0].as_value() })
      return unpacked
    } catch (error) {
      console.error(error)
    }
  }

  async sendMessage(to: DID, from: DID, message: DIDCommMessage) {
    const [plaintext, packed, meta] = await this.prepareMessage(
      to,
      from,
      message
    )
    logger.sentMessage({ to, from, message: plaintext })
    if (!meta.messaging_service) {
      throw new Error("No messaging service found")
    }

    try {
      const response = await fetch(meta.messaging_service.service_endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/didcomm-encrypted+json",
        },
        body: packed,
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(`Error sending message: ${text}`)
      }
      const text = await response.text()
 
      logger.log("Message sent successfully.")
    } catch (error) {
      console.error(error)
    }
  }

  async receiveMessage(message: string): Promise<[Message, UnpackMetadata]> {
    const unpacked = await Message.unpack(
      message,
      this.resolver,
      this.secretsResolver,
      {}
    )
    const plaintext = unpacked[0].as_value()
    logger.recvMessage({
      to: plaintext.to[0],
      from: plaintext.from,
      message: plaintext,
    })
    return unpacked
  }
}

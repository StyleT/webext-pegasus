export default function getConfiguration() {
  const serializer = (payload: unknown) => JSON.stringify(payload);
  const deserializer = (payload: string) => JSON.parse(payload);

  return {
    deserializer,
    serializer,
  };
}

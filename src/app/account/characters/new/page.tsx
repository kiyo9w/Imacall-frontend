'use client';

import { CharacterForm } from '@/components/character/CharacterForm';

export default function NewCharacterPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Submit New Character</h1>
      <CharacterForm mode="create" />
    </div>
  );
}

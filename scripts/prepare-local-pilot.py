import argparse
import hashlib
import json
import math
from pathlib import Path
import wave


def prepare_pilot(source_directory, workspace):
    selection = json.loads((workspace / 'data/pilots/course-pack.json').read_text(encoding='utf-8'))
    prepared = []
    for item in selection['tracks']:
        source = (source_directory / item['sourceFile']).resolve()
        if source.parent != source_directory.resolve():
            raise ValueError('Source must be directly inside the selected music pack')
        with source.open('rb') as recording:
            checksum = hashlib.file_digest(recording, 'sha256').hexdigest()
        if checksum != item['sourceSha256']:
            raise ValueError(f"Different source version: {item['sourceFile']}. Do not reuse its beatgrid.")
        with wave.open(str(source), 'rb') as recording:
            beat_length = 60 / item['bpm']
            anchor = item['firstDownbeat'] + item['startBar'] * 4 * beat_length
            rate = recording.getframerate()
            start_frame = max(0, round((anchor - item['leadSeconds']) * rate))
            end_frame = round((anchor + item['bars'] * 4 * beat_length) * rate)
            if end_frame > recording.getnframes():
                raise ValueError(f"Excerpt exceeds source duration: {item['sourceFile']}")
            recording.setpos(start_frame)
            frames = recording.readframes(end_frame - start_frame)
            silence_frames = round(selection['leadInSeconds'] * rate)
            lead_in = silence_frames / rate
            silent_sample = b'\x80' if recording.getsampwidth() == 1 else b'\x00'
            frames = silent_sample * (silence_frames * recording.getsampwidth() * recording.getnchannels()) + frames
            start = start_frame / rate
            duration = (end_frame - start_frame + silence_frames) / rate
            beats = []
            downbeats = []
            first_index = max(0, math.ceil((start - item['firstDownbeat']) / beat_length))
            beat_index = first_index
            while True:
                position = item['firstDownbeat'] + beat_index * beat_length - start + lead_in
                if position >= duration - 0.02:
                    break
                beats.append(round(position, 6))
                if beat_index % 4 == 0:
                    downbeats.append(round(position, 6))
                beat_index += 1
            track = {key: item[key] for key in ['id', 'title', 'sourceTitle', 'bpm', 'difficulty', 'description']}
            track.update({
                'timeSignature': '4/4',
                'audioFile': f"/tracks/local-pilot/{item['id']}.wav",
                'beats': beats,
                'downbeats': downbeats,
                'duration': round(duration, 6),
                'leadInSeconds': lead_in,
                'referenceStatus': 'pending-listening',
                'referenceSource': 'Serato BeatGrid del archivo original',
                'sourceStart': round(start, 6),
            })
            prepared.append((track, recording.getparams(), frames))

    output_directory = workspace / 'public/tracks/local-pilot'
    output_directory.mkdir(parents=True, exist_ok=True)
    for track, parameters, frames in prepared:
        destination = output_directory / f"{track['id']}.wav"
        temporary = destination.with_suffix('.tmp')
        with wave.open(str(temporary), 'wb') as recording:
            recording.setparams(parameters)
            recording.writeframes(frames)
        temporary.replace(destination)
        print(f"{track['sourceTitle']}: {track['duration']:.2f}s, {len(track['downbeats'])} downbeats")
    manifest = workspace / '.local/pilot.json'
    manifest.parent.mkdir(parents=True, exist_ok=True)
    temporary_manifest = manifest.with_suffix('.tmp')
    temporary_manifest.write_text(json.dumps({'version': 1, 'tracks': [track for track, _, _ in prepared]}, ensure_ascii=False, indent=2), encoding='utf-8')
    temporary_manifest.replace(manifest)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Prepare only the five curated pilot excerpts; never analyze or modify the source library.')
    parser.add_argument('--source-dir', required=True, type=Path)
    arguments = parser.parse_args()
    prepare_pilot(arguments.source_dir, Path(__file__).resolve().parents[1])

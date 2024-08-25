import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import ffmpeg from "fluent-ffmpeg";
import crypto from "crypto";
import ffmpegStatic from "ffmpeg-static";

// Ensure ffmpegStatic is not null
const ffmpegPath = "C:/ffmpeg/bin/ffmpeg.exe";
if (!ffmpegPath) {
  throw new Error(
    "FFmpeg binary not found. Please ensure ffmpeg-static is installed correctly."
  );
}

// Set ffmpeg path to the static binary
ffmpeg.setFfmpegPath(ffmpegPath);

export const FFmpegTranscoder = async (file: any): Promise<any> => {
  try {
    console.log("Starting script");
    console.time("req_time");

    const randomName = (bytes = 32) =>
      crypto.randomBytes(bytes).toString("hex");
    const fileName = randomName();
    const directoryPath = path.join(__dirname, "..", "..", "input");
    const filePath = path.join(directoryPath, `${fileName}.mp4`);

    if (!fs.existsSync(directoryPath)) {
      fs.mkdirSync(directoryPath, { recursive: true });
    }

    const paths = await new Promise<any>((resolve, reject) => {
      fs.writeFile(filePath, file, async (err) => {
        if (err) {
          console.error("Error saving file:", err);
          throw err;
        }
        console.log("File saved successfully:", filePath);

        try {
          const outputDirectoryPath = await transcodeWithFFmpeg(
            fileName,
            filePath
          );
          console.log("Output Directory Path", outputDirectoryPath);

          resolve({ directoryPath, filePath, fileName, outputDirectoryPath });
        } catch (error) {
          console.error("Error transcoding with FFmpeg:", error);
        }
      });
    });
    return paths;
  } catch (e: any) {
    console.log(e);
  }
};

const transcodeWithFFmpeg = async (fileName: string, filePath: string) => {
  const directoryPath = path.join(
    __dirname,
    "..",
    "..",
    `output/hls/${fileName}`
  );
  console.log("filepath", filePath);
  
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
  }

  const resolutions = [
    { resolution: "256x144", videoBitrate: "200k", audioBitrate: "64k" },
    { resolution: "640x360", videoBitrate: "800k", audioBitrate: "128k" },
    { resolution: "1280x720", videoBitrate: "2500k", audioBitrate: "192k" },
    { resolution: "1920x1080", videoBitrate: "5000k", audioBitrate: "256k" },
  ];

  const variantPlaylists: { resolution: string; outputFileName: string }[] = [];

  for (const { resolution, videoBitrate, audioBitrate } of resolutions) {
    console.log(`HLS conversion starting for ${resolution}`);
    const outputFileName = `${fileName}_${resolution}.m3u8`;
    const segmentFileName = `${fileName}_${resolution}_%03d.ts`;

    await new Promise<void>((resolve, reject) => {
      ffmpeg(filePath)
      .videoCodec('libx264') // Set video codec to libx264
      .audioCodec('aac') // Set audio codec to aac
      .videoBitrate(videoBitrate) // Set video bitrate
      .audioBitrate(audioBitrate) // Set audio bitrate
      .size(resolution) // Set resolution
      .format('hls') // Set output format to HLS
      .outputOptions([
        `-hls_time 10`, // Duration of each segment in seconds
        `-hls_list_size 0`, // Include all segments in the playlist
        
      ])
      .output(path.join(directoryPath, outputFileName).replace(/\\/g, "/")) // Master playlist output
      .on("end", () => {
        console.log(`HLS conversion done for ${resolution}`);
        resolve();
      })
      .on("error", (err) => {
        console.error(`Error during HLS conversion for ${resolution}:`, err);
        reject(err);
      })
      .run();
  });

    const variantPlaylist = { resolution, outputFileName };
    variantPlaylists.push(variantPlaylist);
    console.log(`HLS conversion done for ${resolution}`);
  }

  console.log(`HLS master m3u8 playlist generating`);

  let masterPlaylist = variantPlaylists
    .map(({ resolution, outputFileName }) => {
      const bandwidth = {
        "256x144": 264000,
        "640x360": 1024000,
        "1280x720": 3072000,
        "1920x1080": 5500000,
      }[resolution];
      return `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${resolution}\n${outputFileName}`;
    })
    .join("\n");

  masterPlaylist = `#EXTM3U\n` + masterPlaylist;
  const masterPlaylistFileName = `${fileName}_master.m3u8`;
  const masterPlaylistPath = path
    .join(directoryPath, masterPlaylistFileName)
    .replace(/\\/g, "/");
  fs.writeFileSync(masterPlaylistPath, masterPlaylist);
  console.log(`HLS master m3u8 playlist generated`);

  return directoryPath;
};

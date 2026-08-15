import { Node } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    fileVideo: {
      setFileVideo: (options: { src: string }) => ReturnType;
    };
  }
}

/**
 * A plain HTML5 `<video>` block. The Youtube extension only handles YouTube URLs, so a
 * file picked from disk or a direct .mp4 link had nowhere to go — it would have been
 * handed to `setYoutubeVideo` and rendered as a broken embed.
 */
export const FileVideo = Node.create({
  name: "fileVideo",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return { src: { default: null } };
  },

  parseHTML() {
    return [{ tag: "video[src]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["video", { controls: "true", ...HTMLAttributes }];
  },

  addCommands() {
    return {
      setFileVideo:
        (options) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs: options }),
    };
  },
});

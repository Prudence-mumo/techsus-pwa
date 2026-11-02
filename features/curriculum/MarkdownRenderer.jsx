"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

function normalizeLatex(text) {
  if (typeof text !== "string") return "";

  return text
    .replace(/\\\[([\s\S]*?)\\\]/g, (_, match) => `\n$$\n${match.trim()}\n$$\n`)
    .replace(/\\\(([\s\S]*?)\\\)/g, (_, match) => `$${match.trim()}$`);
}

export default function MarkdownRenderer({ content, subject, mediaUrl }) {
  const backendBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";

  if (!content) return null;

  let rawText = content;
  if (typeof content === "object") {
    rawText =
      content.ai_response ||
      content.text ||
      content.body ||
      content.message ||
      JSON.stringify(content);
  }

  // If we have a mediaUrl, replace any "Page X image Y" references with it
  // This must happen BEFORE normalizeLatex converts them to markdown image tags
  if (mediaUrl) {
    rawText = rawText.replace(
      /Page\s+(\d+)\s+image\s+(\d+)/gi,
      `![Curriculum illustration](${mediaUrl})`,
    );
    // Also handle already-converted markdown image tags from normalizeLatex
    rawText = rawText.replace(
      /!\[Page\s+\d+\s+image\s+\d+\]\(page_\d+_image_\d+\.(?:png|jpeg|jpg)\)/gi,
      `![Curriculum illustration](${mediaUrl})`,
    );
  }

  const processedContent = normalizeLatex(rawText);

  return (
    <div className="prose prose-sm max-w-none text-gray-800 leading-relaxed space-y-3 dark:prose-invert">
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          img: ({ src, alt, ...props }) => {
            if (!src) return null;

            // If src looks like a page image reference and we have mediaUrl, use it
            const finalSrc =
              mediaUrl && (src.includes("page_") || src.includes("/content/"))
                ? mediaUrl
                : src;

            const isAbsolute = /^https?:\/\//i.test(finalSrc);
            const imageSrc = isAbsolute
              ? finalSrc
              : finalSrc.startsWith("/")
                ? `${backendBaseUrl}${finalSrc}`
                : `${backendBaseUrl}/${finalSrc}`;

            return (
              <span className="my-4 block text-center">
                <img
                  src={imageSrc}
                  alt={alt || `${subject || "Curriculum"} illustration`}
                  className="max-h-80 w-auto rounded-lg shadow-md border border-gray-200 mx-auto inline-block object-contain bg-white p-1"
                  onError={(e) => {
                    console.error("Failed to load image:", imageSrc);
                    e.currentTarget.style.display = "none";
                    const parent = e.currentTarget.parentElement;
                    if (parent && !parent.querySelector(".img-error")) {
                      const err = document.createElement("span");
                      err.className =
                        "img-error block text-xs text-red-500 italic mt-1 font-sans bg-red-50 p-2 rounded border border-red-200";
                      err.innerText = `[Image failed to load: ${imageSrc}]`;
                      parent.appendChild(err);
                    }
                  }}
                  {...props}
                />
                {alt && null}
              </span>
            );
          },

          table: ({ ...props }) => (
            <div className="overflow-x-auto my-4 rounded-lg border border-gray-200 shadow-sm">
              <table
                className="min-w-full divide-y divide-gray-200 text-sm"
                {...props}
              />
            </div>
          ),
          thead: ({ ...props }) => (
            <thead
              className="bg-gray-100 text-gray-700 font-semibold dark:bg-gray-800 dark:text-gray-200"
              {...props}
            />
          ),
          th: ({ ...props }) => (
            <th
              className="px-3 py-2 text-left border-b font-medium"
              {...props}
            />
          ),
          td: ({ ...props }) => (
            <td
              className="px-3 py-2 border-b border-gray-100 text-gray-600 dark:border-gray-700 dark:text-gray-300"
              {...props}
            />
          ),

          code: ({ inline, children, ...props }) => {
            if (inline) {
              return (
                <code
                  className="bg-gray-100 dark:bg-gray-800 text-indigo-700 dark:text-indigo-400 px-1.5 py-0.5 rounded text-xs font-mono border border-gray-200 dark:border-gray-700"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <code
                className="block bg-gray-900 text-gray-100 p-3 rounded-xl text-xs font-mono overflow-x-auto my-3"
                {...props}
              >
                {children}
              </code>
            );
          },
        }}
      >
        {processedContent}
      </ReactMarkdown>
      {mediaUrl && (
        <span className="my-4 block text-center">
          <img
            src={mediaUrl}
            alt={`${subject || "Curriculum"} illustration`}
            className="max-h-80 w-auto rounded-lg shadow-md border border-gray-200 mx-auto inline-block object-contain bg-white p-1"
          />
        </span>
      )}
    </div>
  );
}

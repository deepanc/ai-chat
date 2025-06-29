<html>
  <head>
    <link rel="preconnect" href="https://fonts.gstatic.com/" crossorigin="" />
    <link
      rel="stylesheet"
      as="style"
      onload="this.rel='stylesheet'"
      href="https://fonts.googleapis.com/css2?display=swap&amp;family=Noto+Sans%3Awght%40400%3B500%3B700%3B900&amp;family=Spline+Sans%3Awght%40400%3B500%3B700"
    />

    <title>Stitch Design</title>
    <link rel="icon" type="image/x-icon" href="data:image/x-icon;base64," />

    <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
  </head>
  <body>
    <div
      class="relative flex size-full min-h-screen flex-col bg-white group/design-root overflow-x-hidden"
      style='font-family: "Spline Sans", "Noto Sans", sans-serif;'
    >
      <div class="layout-container flex h-full grow flex-col">
        <header class="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#f0f2f5] px-10 py-3">
          <div class="flex items-center gap-4 text-[#111518]">
            <div class="size-4">
              <svg
                viewBox="0 0 48 48"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M24 45.8096C19.6865 45.8096 15.4698 44.5305 11.8832 42.134C8.29667 39.7376 5.50128 36.3314 3.85056 32.3462C2.19985 28.361 1.76794 23.9758 2.60947 19.7452C3.451 15.5145 5.52816 11.6284 8.57829 8.5783C11.6284 5.52817 15.5145 3.45101 19.7452 2.60948C23.9758 1.76795 28.361 2.19986 32.3462 3.85057C36.3314 5.50129 39.7376 8.29668 42.134 11.8833C44.5305 15.4698 45.8096 19.6865 45.8096 24L24 24L24 45.8096Z"
                  fill="currentColor"
                ></path>
              </svg>
            </div>
            <h2 class="text-[#111518] text-lg font-bold leading-tight tracking-[-0.015em]">
              ChatterBox
            </h2>
          </div>
          <div class="flex flex-1 justify-end gap-8">
            <div class="flex items-center gap-9">
              <a
                class="text-[#111518] text-sm font-medium leading-normal"
                href="#"
              >
                Home
              </a>
              <a
                class="text-[#111518] text-sm font-medium leading-normal"
                href="#"
              >
                Explore
              </a>
              <a
                class="text-[#111518] text-sm font-medium leading-normal"
                href="#"
              >
                Create
              </a>
            </div>
            <button class="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 bg-[#f0f2f5] text-[#111518] gap-2 text-sm font-bold leading-normal tracking-[0.015em] min-w-0 px-2.5">
              <div
                class="text-[#111518]"
                data-icon="Bell"
                data-size="20px"
                data-weight="regular"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20px"
                  height="20px"
                  fill="currentColor"
                  viewBox="0 0 256 256"
                >
                  <path d="M221.8,175.94C216.25,166.38,208,139.33,208,104a80,80,0,1,0-160,0c0,35.34-8.26,62.38-13.81,71.94A16,16,0,0,0,48,200H88.81a40,40,0,0,0,78.38,0H208a16,16,0,0,0,13.8-24.06ZM128,216a24,24,0,0,1-22.62-16h45.24A24,24,0,0,1,128,216ZM48,184c7.7-13.24,16-43.92,16-80a64,64,0,1,1,128,0c0,36.05,8.28,66.73,16,80Z"></path>
                </svg>
              </div>
            </button>
            <div
              class="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10"
              style='background-image: url("https://lh3.googleusercontent.com/aida-public/AB6AXuDw63AkpLFOcMOHB2YFs6kaTTOHF0C_SAbHFAe07MogxbtKsg6pgUR_miag9GTd2Ez9oSyJ8YQ4cYVS0o8rdFcRyYcLu8phDgAtGPV91pVMcwhKEAncR4FHVujlzYJw8w_0VAvNNCV-Z_oD_w5oevyp7QEdcW_NfdgWaUMZikKQF7O5p5Gw_ySFBmjU6--ypOsCySRCE1Mg3Vy2Z8buGCQJpwP1HMcanq3Thpi77xAWcOjSZLrDQLtgqRRXEFdsd9E4cLfYZhyMJVfk");'
            ></div>
          </div>
        </header>
        <div class="px-40 flex flex-1 justify-center py-5">
          <div class="layout-content-container flex flex-col max-w-[960px] flex-1">
            <div class="flex flex-wrap justify-between gap-3 p-4">
              <p class="text-[#111518] tracking-light text-[32px] font-bold leading-tight min-w-72">
                Create a new room
              </p>
            </div>
            <div class="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
              <label class="flex flex-col min-w-40 flex-1">
                <p class="text-[#111518] text-base font-medium leading-normal pb-2">
                  Room name
                </p>
                <input
                  placeholder="Enter room name"
                  class="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-[#111518] focus:outline-0 focus:ring-0 border border-[#dbe1e6] bg-white focus:border-[#dbe1e6] h-14 placeholder:text-[#60768a] p-[15px] text-base font-normal leading-normal"
                  value=""
                />
              </label>
            </div>
            <h3 class="text-[#111518] text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">
              Template
            </h3>
            <div class="flex flex-wrap gap-3 p-4">
              <label class="text-sm font-medium leading-normal flex items-center justify-center rounded-xl border border-[#dbe1e6] px-4 h-11 text-[#111518] has-[:checked]:border-[3px] has-[:checked]:px-3.5 has-[:checked]:border-[#0b80ee] relative cursor-pointer">
                General
                <input
                  type="radio"
                  class="invisible absolute"
                  name="273c37b0-fe04-4dfd-a7c0-44d9c091b455"
                />
              </label>
              <label class="text-sm font-medium leading-normal flex items-center justify-center rounded-xl border border-[#dbe1e6] px-4 h-11 text-[#111518] has-[:checked]:border-[3px] has-[:checked]:px-3.5 has-[:checked]:border-[#0b80ee] relative cursor-pointer">
                Debate
                <input
                  type="radio"
                  class="invisible absolute"
                  name="273c37b0-fe04-4dfd-a7c0-44d9c091b455"
                />
              </label>
              <label class="text-sm font-medium leading-normal flex items-center justify-center rounded-xl border border-[#dbe1e6] px-4 h-11 text-[#111518] has-[:checked]:border-[3px] has-[:checked]:px-3.5 has-[:checked]:border-[#0b80ee] relative cursor-pointer">
                Brainstorm
                <input
                  type="radio"
                  class="invisible absolute"
                  name="273c37b0-fe04-4dfd-a7c0-44d9c091b455"
                />
              </label>
              <label class="text-sm font-medium leading-normal flex items-center justify-center rounded-xl border border-[#dbe1e6] px-4 h-11 text-[#111518] has-[:checked]:border-[3px] has-[:checked]:px-3.5 has-[:checked]:border-[#0b80ee] relative cursor-pointer">
                Custom
                <input
                  type="radio"
                  class="invisible absolute"
                  name="273c37b0-fe04-4dfd-a7c0-44d9c091b455"
                />
              </label>
            </div>
            <div class="grid grid-cols-[repeat(auto-fit,minmax(158px,1fr))] gap-3 p-4">
              <div class="flex flex-1 gap-3 rounded-lg border border-[#dbe1e6] bg-white p-4 items-center">
                <div
                  class="text-[#111518]"
                  data-icon="ChatCircleDots"
                  data-size="24px"
                  data-weight="regular"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24px"
                    height="24px"
                    fill="currentColor"
                    viewBox="0 0 256 256"
                  >
                    <path d="M140,128a12,12,0,1,1-12-12A12,12,0,0,1,140,128ZM84,116a12,12,0,1,0,12,12A12,12,0,0,0,84,116Zm88,0a12,12,0,1,0,12,12A12,12,0,0,0,172,116Zm60,12A104,104,0,0,1,79.12,219.82L45.07,231.17a16,16,0,0,1-20.24-20.24l11.35-34.05A104,104,0,1,1,232,128Zm-16,0A88,88,0,1,0,51.81,172.06a8,8,0,0,1,.66,6.54L40,216,77.4,203.53a7.85,7.85,0,0,1,2.53-.42,8,8,0,0,1,4,1.08A88,88,0,0,0,216,128Z"></path>
                  </svg>
                </div>
                <h2 class="text-[#111518] text-base font-bold leading-tight">
                  General
                </h2>
              </div>
              <div class="flex flex-1 gap-3 rounded-lg border border-[#dbe1e6] bg-white p-4 items-center">
                <div
                  class="text-[#111518]"
                  data-icon="Megaphone"
                  data-size="24px"
                  data-weight="regular"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24px"
                    height="24px"
                    fill="currentColor"
                    viewBox="0 0 256 256"
                  >
                    <path d="M240,120a48.05,48.05,0,0,0-48-48H152.2c-2.91-.17-53.62-3.74-101.91-44.24A16,16,0,0,0,24,40V200a16,16,0,0,0,26.29,12.25c37.77-31.68,77-40.76,93.71-43.3v31.72A16,16,0,0,0,151.12,214l11,7.33A16,16,0,0,0,186.5,212l11.77-44.36A48.07,48.07,0,0,0,240,120ZM40,199.93V40h0c42.81,35.91,86.63,45,104,47.24v65.48C126.65,155,82.84,164.07,40,199.93Zm131,8,0,.11-11-7.33V168h21.6ZM192,152H160V88h32a32,32,0,1,1,0,64Z"></path>
                  </svg>
                </div>
                <h2 class="text-[#111518] text-base font-bold leading-tight">
                  Debate
                </h2>
              </div>
              <div class="flex flex-1 gap-3 rounded-lg border border-[#dbe1e6] bg-white p-4 items-center">
                <div
                  class="text-[#111518]"
                  data-icon="Lightbulb"
                  data-size="24px"
                  data-weight="regular"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24px"
                    height="24px"
                    fill="currentColor"
                    viewBox="0 0 256 256"
                  >
                    <path d="M176,232a8,8,0,0,1-8,8H88a8,8,0,0,1,0-16h80A8,8,0,0,1,176,232Zm40-128a87.55,87.55,0,0,1-33.64,69.21A16.24,16.24,0,0,0,176,186v6a16,16,0,0,1-16,16H96a16,16,0,0,1-16-16v-6a16,16,0,0,0-6.23-12.66A87.59,87.59,0,0,1,40,104.49C39.74,56.83,78.26,17.14,125.88,16A88,88,0,0,1,216,104Zm-16,0a72,72,0,0,0-73.74-72c-39,.92-70.47,33.39-70.26,72.39a71.65,71.65,0,0,0,27.64,56.3A32,32,0,0,1,96,186v6h64v-6a32.15,32.15,0,0,1,12.47-25.35A71.65,71.65,0,0,0,200,104Zm-16.11-9.34a57.6,57.6,0,0,0-46.56-46.55,8,8,0,0,0-2.66,15.78c16.57,2.79,30.63,16.85,33.44,33.45A8,8,0,0,0,176,104a9,9,0,0,0,1.35-.11A8,8,0,0,0,183.89,94.66Z"></path>
                  </svg>
                </div>
                <h2 class="text-[#111518] text-base font-bold leading-tight">
                  Brainstorm
                </h2>
              </div>
              <div class="flex flex-1 gap-3 rounded-lg border border-[#dbe1e6] bg-white p-4 items-center">
                <div
                  class="text-[#111518]"
                  data-icon="PencilSimple"
                  data-size="24px"
                  data-weight="regular"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24px"
                    height="24px"
                    fill="currentColor"
                    viewBox="0 0 256 256"
                  >
                    <path d="M227.31,73.37,182.63,28.68a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H92.69A15.86,15.86,0,0,0,104,219.31L227.31,96a16,16,0,0,0,0-22.63ZM92.69,208H48V163.31l88-88L180.69,120ZM192,108.68,147.31,64l24-24L216,84.68Z"></path>
                  </svg>
                </div>
                <h2 class="text-[#111518] text-base font-bold leading-tight">
                  Custom
                </h2>
              </div>
            </div>
            <div class="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
              <label class="flex flex-col min-w-40 flex-1">
                <p class="text-[#111518] text-base font-medium leading-normal pb-2">
                  Custom template
                </p>
                <textarea
                  placeholder="Describe the purpose of the room and how the AI should behave"
                  class="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-[#111518] focus:outline-0 focus:ring-0 border border-[#dbe1e6] bg-white focus:border-[#dbe1e6] min-h-36 placeholder:text-[#60768a] p-[15px] text-base font-normal leading-normal"
                ></textarea>
              </label>
            </div>
            <div class="flex px-4 py-3 justify-end">
              <button class="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-4 bg-[#0b80ee] text-white text-sm font-bold leading-normal tracking-[0.015em]">
                <span class="truncate">Create room</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </body>
</html>;

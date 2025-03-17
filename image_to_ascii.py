from PIL import Image, ImageDraw, ImageFont
import math
import os
import time

# Define the 16 original VGA colors (text mode) as names and their ANSI escape codes
VGA_COLORS = {
    "black": "\x1b[30m",
    "blue": "\x1b[34m",
    "green": "\x1b[32m",
    "cyan": "\x1b[36m",
    "red": "\x1b[31m",
    "magenta": "\x1b[35m",
    "brown": "\x1b[33m",
    "light_gray": "\x1b[37m",
    "dark_gray": "\x1b[90m",
    "light_blue": "\x1b[94m",
    "light_green": "\x1b[92m",
    "light_cyan": "\x1b[96m",
    "light_red": "\x1b[91m",
    "light_magenta": "\x1b[95m",
    "yellow": "\x1b[93m",
    "white": "\x1b[97m",
}

VGA_BG_COLORS = {
    "black": "\x1b[40m",
    "blue": "\x1b[44m",
    "green": "\x1b[42m",
    "cyan": "\x1b[46m",
    "red": "\x1b[41m",
    "magenta": "\x1b[45m",
    "brown": "\x1b[43m",
    "light_gray": "\x1b[47m",
    "dark_gray": "\x1b[100m",
    "light_blue": "\x1b[104m",
    "light_green": "\x1b[102m",
    "light_cyan": "\x1b[106m",
    "light_red": "\x1b[101m",
    "light_magenta": "\x1b[105m",
    "yellow": "\x1b[103m",
    "white": "\x1b[107m",
}

# Extended ASCII characters
# ALL_CHARS = [chr(i) for i in range(256) if chr(i).isprintable()]
ALL_CHARS = ['#', '@', '%', '&', '*', '+', '=', '-', '.', ':', ',', '"', '\'', '^', '~', '!', '|', '/', '\\', ';', '_']
RESET_COLOR = "\x1b[0m"

# --- New code for precomputing character foreground percentages ---

def calculate_char_foreground_percentage(char, font_path=None, font_size=16):
    """Calculates the foreground percentage of a character.

    Args:
        char: The character to analyze.
        font_path: The path to a TrueType font file (e.g., .ttf). If None, a default font might be used.
        font_size: The font size to use.

    Returns:
        The approximate foreground percentage of the character (0.0 to 1.0).
    """
    # Create a blank image (black background)
    img_size = (font_size, font_size)  # Adjust as needed for your font
    img = Image.new('L', img_size, 0)  # 'L' mode is grayscale

    # Draw the character in white
    draw = ImageDraw.Draw(img)
    
    try:
        if font_path:
            font = ImageFont.truetype(font_path, font_size)
            draw.text((0, 0), char, font=font, fill=255)
        else:
            font = ImageFont.load_default()
            draw.text((0,0), char, font=font, fill=255)
    except Exception as e:
        print(f"Could not load font: {e}")
        return 0.0
        
    # Calculate the average brightness (gray level)
    pixels = list(img.getdata())
    total_brightness = sum(pixels)
    foreground_percentage = total_brightness / (img_size[0] * img_size[1] * 255)
    
    return foreground_percentage

def precompute_char_foreground_percentages(all_chars, font_path=None, font_size=16):
    """Precomputes and stores the foreground percentages for all characters.

    Args:
        all_chars: A list of all the characters to precompute.
        font_path: The path to a TrueType font file (e.g., .ttf).
        font_size: The font size to use.
    Returns:
        A dictionary where keys are characters and values are their foreground percentages.
    """
    print("Precomputing character foreground percentages...")
    char_percentages = {}
    for char in all_chars:
        char_percentages[char] = calculate_char_foreground_percentage(char, font_path, font_size)
    print("Character foreground percentages precomputed.")
    return char_percentages

# --- End of new code ---

# Precompute the foreground percentages for all characters
CHAR_FOREGROUND_PERCENTAGES = precompute_char_foreground_percentages(ALL_CHARS, font_size=16)

def image_to_ascii(image_path, width, height):
    try:
        img = Image.open(image_path).convert('RGB')
    except FileNotFoundError:
        print(f"Error: Image file not found at {image_path}")
        return None
    except Exception as e:
        print(f"Error opening image: {e}")
        return None

    img = img.resize((width, height))
    pixels = list(img.getdata())

    ascii_art = []
    color_data = []
    for y in range(height):
        ascii_art.append([])
        color_data.append([])
        for x in range(width):
            r, g, b = pixels[y * width + x]

            # Find the best matching color and char.
            best_match = find_best_match(r, g, b)

            ascii_art[y].append(best_match["char"])
            color_data[y].append(
                {"fgColor": best_match["fgColor"], "bgColor": best_match["bgColor"]})

    return {"asciiArt": ascii_art, "colorData": color_data}


def find_best_match(r, g, b):
    best_match = {
        "fgColor": VGA_COLORS["white"],
        "bgColor": VGA_BG_COLORS["black"],
        "char": " ",
        "error": float('inf')
    }

    for fg_key, fg_color in VGA_COLORS.items():
        for bg_key, bg_color in VGA_BG_COLORS.items():
            for char in ALL_CHARS:
                fg_rgb = ansi_to_rgb(fg_color)
                bg_rgb = ansi_to_rgb(bg_color)
                char_error = calculate_error(r, g, b, fg_rgb["r"], fg_rgb["g"],
                                             fg_rgb["b"], bg_rgb["r"], bg_rgb["g"], bg_rgb["b"], char)

                if char_error < best_match["error"]:
                    best_match = {
                        "fgColor": fg_color,
                        "bgColor": bg_color,
                        "char": char,
                        "error": char_error
                    }
    # Added color of the char to this function.
    # If the best background color is dark, make the char lighter.
    # If the best background color is light, make the char darker.
    bg_rgb = ansi_to_rgb(best_match["bgColor"])
    brightness = (bg_rgb["r"] + bg_rgb["g"] + bg_rgb["b"]) / 3
    if brightness > 128:
        # light background, so make the char darker.
        best_match["fgColor"] = VGA_COLORS["black"]
    else:
        # dark background, so make the char lighter.
        best_match["fgColor"] = VGA_COLORS["white"]

    return best_match


def calculate_error(r, g, b, fr, fg, fb, br, bg, bb, char):
    # This could be made more complex by including the error for the shape of the character.
    # we are now including the character coverage.
    char_coverage_error = abs((r+g+b)/3 - CHAR_FOREGROUND_PERCENTAGES[char]*255)
    color_error = math.sqrt(
        (r - fr)**2 +
        (g - fg)**2 +
        (b - fb)**2
    )
    bg_color_error = math.sqrt(
        (r - br)**2 +
        (g - bg)**2 +
        (b - bb)**2
    )

    return (color_error * 0.4) + (bg_color_error * 0.4) + char_coverage_error*0.2


def ansi_to_rgb(ansi):
    color_map = {
        "\x1b[30m": {"r": 0, "g": 0, "b": 0},  # Black
        "\x1b[31m": {"r": 128, "g": 0, "b": 0},  # Red
        "\x1b[32m": {"r": 0, "g": 128, "b": 0},  # Green
        "\x1b[33m": {"r": 128, "g": 128, "b": 0},  # Brown
        "\x1b[34m": {"r": 0, "g": 0, "b": 128},  # Blue
        "\x1b[35m": {"r": 128, "g": 0, "b": 128},  # Magenta
        "\x1b[36m": {"r": 0, "g": 128, "b": 128},  # Cyan
        "\x1b[37m": {"r": 192, "g": 192, "b": 192},  # Light Gray
        "\x1b[90m": {"r": 128, "g": 128, "b": 128},  # Dark Gray
        "\x1b[91m": {"r": 255, "g": 0, "b": 0},  # Light Red
        "\x1b[92m": {"r": 0, "g": 255, "b": 0},  # Light Green
        "\x1b[93m": {"r": 255, "g": 255, "b": 0},  # Yellow
        "\x1b[94m": {"r": 0, "g": 0, "b": 255},  # Light Blue
        "\x1b[95m": {"r": 255, "g": 0, "b": 255},  # Light Magenta
        "\x1b[96m": {"r": 0, "g": 255, "b": 255},  # Light Cyan
        "\x1b[97m": {"r": 255, "g": 255, "b": 255},  # White
        "\x1b[40m": {"r": 0, "g": 0, "b": 0},  # Black
        "\x1b[41m": {"r": 128, "g": 0, "b": 0},  # Red
        "\x1b[42m": {"r": 0, "g": 128, "b": 0},  # Green
        "\x1b[43m": {"r": 128, "g": 128, "b": 0},  # Brown
        "\x1b[44m": {"r": 0, "g": 0, "b": 128},  # Blue
        "\x1b[45m": {"r": 128, "g": 0, "b": 128},  # Magenta
        "\x1b[46m": {"r": 0, "g": 128, "b": 128},  # Cyan
        "\x1b[47m": {"r": 192, "g": 192, "b": 192},  # Light Gray
        "\x1b[100m": {"r": 128, "g": 128, "b": 128},  # Dark Gray
        "\x1b[101m": {"r": 255, "g": 0, "b": 0},  # Light Red
        "\x1b[102m": {"r": 0, "g": 255, "b": 0},  # Light Green
        "\x1b[103m": {"r": 255, "g": 255, "b": 0},  # Yellow
        "\x1b[104m": {"r": 0, "g": 0, "b": 255},  # Light Blue
        "\x1b[105m": {"r": 255, "g": 0, "b": 255},  # Light Magenta
        "\x1b[106m": {"r": 0, "g": 255, "b": 255},  # Light Cyan
        "\x1b[107m": {"r": 255, "g": 255, "b": 255},  # White
    }
    return color_map.get(ansi, {"r": 0, "g": 0, "b": 0})  # Default to black if not found


def print_ascii_art(ascii_art, color_data):
    for y in range(len(ascii_art)):
        line = ""
        for x in range(len(ascii_art[y])):
            line += f"{color_data[y][x]['bgColor']}{color_data[y][x]['fgColor']}{ascii_art[y][x]}{RESET_COLOR}"
        print(line)


def save_to_file(ascii_art, filename="output.txt"):
    with open(filename, "w") as f:
        for row in ascii_art:
            f.write("".join(row) + "\n")
    print(f"ASCII art saved to {filename}")


def main():
    image_path = './input.jpg'  # Replace with your image path
    output_width = 40
    output_height = 5

    start_time = time.time()  # Start time before calling image_to_ascii
    result = image_to_ascii(image_path, output_width, output_height)
    end_time = time.time()  # End time after image_to_ascii returns

    if result:
        print_ascii_art(result["asciiArt"], result["colorData"])
        save_to_file(result["asciiArt"])

    total_time = end_time - start_time
    print(f"\nTotal time to run image_to_ascii: {total_time:.4f} seconds")


if __name__ == "__main__":
    main()

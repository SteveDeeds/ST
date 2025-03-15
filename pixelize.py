from PIL import Image
import math
import time

# Define the 16 original VGA colors (text mode) as RGB tuples
VGA_COLORS = {
    "black": (0, 0, 0),
    "blue": (0, 0, 64),
    "green": (0, 64, 0),
    "cyan": (0, 64, 64),
    "red": (64, 0, 0),
    "magenta": (64, 0, 64),
    "brown": (64, 0, 0),
    "light_gray": (64, 64, 64),
    "dark_gray": (32, 32, 32),
    "light_blue": (0, 0, 255),
    "light_green": (0, 255, 0),
    "light_cyan": (0, 255, 255),
    "light_red": (255, 0, 0),
    "light_magenta": (255, 0, 255),
    "yellow": (255, 255, 0),
    "white": (255, 255, 255),
}

# Create all combinations of two VGA colors (for the checkerboard)
VGA_COLOR_PAIRS = []
vga_color_names = list(VGA_COLORS.keys())
for i in range(len(vga_color_names)):
    for j in range(i, len(vga_color_names)):
        VGA_COLOR_PAIRS.append((vga_color_names[i], vga_color_names[j]))

def closest_vga_color_or_pair(r, g, b):
    """Finds the closest single VGA color or a pair of VGA colors to the given RGB color."""
    min_distance = float('inf')
    closest_match = None

    # Check single colors
    for color_name, color_rgb in VGA_COLORS.items():
        distance = math.sqrt(
            (r - color_rgb[0]) ** 2 +
            (g - color_rgb[1]) ** 2 +
            (b - color_rgb[2]) ** 2
        )
        if distance < min_distance:
            min_distance = distance
            closest_match = (color_name,)  # Store as a tuple for consistency

    # Check color pairs (checkerboard pattern)
    for color1_name, color2_name in VGA_COLOR_PAIRS:
        color1_rgb = VGA_COLORS[color1_name]
        color2_rgb = VGA_COLORS[color2_name]
        avg_r = (color1_rgb[0] + color2_rgb[0]) // 2
        avg_g = (color1_rgb[1] + color2_rgb[1]) // 2
        avg_b = (color1_rgb[2] + color2_rgb[2]) // 2

        distance = math.sqrt(
            (r - avg_r) ** 2 +
            (g - avg_g) ** 2 +
            (b - avg_b) ** 2
        )
        if distance < min_distance:
            min_distance = distance
            closest_match = (color1_name, color2_name)

    return closest_match


def pixelize_image(image_path, pixel_size=10):
    """Pixelizes an image using single or mixed VGA colors in a checkerboard pattern."""
    try:
        img = Image.open(image_path).convert('RGB')
    except FileNotFoundError:
        print(f"Error: Image file not found at {image_path}")
        return None
    except Exception as e:
        print(f"Error opening image: {e}")
        return None

    width, height = img.size
    new_width = width // pixel_size
    new_height = height // pixel_size

    pixelized_img = Image.new('RGB', (new_width * pixel_size, new_height * pixel_size))

    for y in range(new_height):
        for x in range(new_width):
            # Get the average color of the pixel area
            r_total, g_total, b_total = 0, 0, 0
            for py in range(pixel_size):
                for px in range(pixel_size):
                    try:
                        r, g, b = img.getpixel((x * pixel_size + px, y * pixel_size + py))
                        r_total += r
                        g_total += g
                        b_total += b
                    except IndexError:
                        pass

            avg_r = r_total // (pixel_size * pixel_size)
            avg_g = g_total // (pixel_size * pixel_size)
            avg_b = b_total // (pixel_size * pixel_size)

            # Find the closest VGA color or color pair
            vga_match = closest_vga_color_or_pair(avg_r, avg_g, avg_b)

            # Draw the pixel with the correct color or checkerboard
            draw_area = (x * pixel_size, y * pixel_size, (x + 1) * pixel_size, (y + 1) * pixel_size)
            pixels = pixelized_img.load()

            if len(vga_match) == 1:  # Single color
                vga_color = VGA_COLORS[vga_match[0]]
                for py in range(draw_area[1], draw_area[3]):
                    for px in range(draw_area[0], draw_area[2]):
                        try:
                            pixels[px, py] = vga_color
                        except Exception as e:
                            print(f"error drawing pixel {e}")
                            pass
            else:  # Checkerboard pattern
                color1 = VGA_COLORS[vga_match[0]]
                color2 = VGA_COLORS[vga_match[1]]
                for py in range(draw_area[1], draw_area[3]):
                    for px in range(draw_area[0], draw_area[2]):
                        # Calculate the position within the checkerboard pattern
                        local_px = px % pixel_size
                        local_py = py % pixel_size

                        # Determine color based on 2x2 checkerboard pattern
                        if (local_px // 2 + local_py // 2) % 2 == 0:
                            try:
                                pixels[px, py] = color1
                            except Exception as e:
                                print(f"error drawing pixel {e}")
                                pass
                        else:
                            try:
                                pixels[px, py] = color2
                            except Exception as e:
                                print(f"error drawing pixel {e}")
                                pass

    return pixelized_img


def main():
    image_path = "./input.jpg"  # Replace with your image path
    pixel_size = 12  # Adjust for larger or smaller pixels

    start_time = time.time()
    pixelized_image = pixelize_image(image_path, pixel_size)
    end_time = time.time()

    if pixelized_image:
        pixelized_image.save("output_pixelized.png")  # Save the image
        print(f"Pixelized image saved to output_pixelized.png")

    print(f"\nTotal time to run pixelize_image: {end_time - start_time:.4f} seconds")


if __name__ == "__main__":
    main()

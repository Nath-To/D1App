# Importacion de Librerías
from webdriver_manager.chrome import ChromeDriverManager
# Descarga automáticamente el driver de Chrome compatible con el navegador
from selenium import webdriver
from selenium.webdriver import Chrome
from selenium.webdriver.chrome.service import Service
# Importa herramienta para controlar el navegador Chrome
import time
# Permite pausar la ejecución con time.sleep()
from selenium.webdriver.common.by import By
# Define la forma de localizar elementos (By.ID, By.NAME, By.XPATH, etc.).
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait as Wait


# --- PASO 3: IMPORTACIONES (Lo que ya tienes) ---

from webdriver_manager.chrome import ChromeDriverManager

from selenium import webdriver

from selenium.webdriver.chrome.service import Service

from selenium.webdriver.chrome.options import Options # Para las opciones del navegador

import time


# Credenciales de prueba para iniciar sesión en tu sitio
USER = "elidreyes@correo.com"
PASSWORD = "elidreyes"
 
# --- PASO 4: CONFIGURACIÓN DEL NAVEGADOR ---

def main():

    service = Service(ChromeDriverManager().install())

    options = webdriver.ChromeOptions()

    options.add_argument("--window-size=1920, 1080")

    driver = webdriver.Chrome(service=service, options=options)

    wait = Wait(driver, 10)

    try:

        # 1. Abrir la App

        driver.get("http://localhost:3000")

        print("Esperando 4 segundos para que veas la carga...")

        time.sleep(4) # Pausa inicial

        # 2. Clic en la pestaña de Iniciar Sesión

        tab_login = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Iniciar sesión')]")))

        tab_login.click()

        print("Pestaña seleccionada. Esperando 3 segundos...")

        time.sleep(3) # Pausa para ver el cambio de pestaña

        # 3. Escribir el Correo

        email_field = wait.until(EC.element_to_be_clickable((By.ID, "login-email")))

        email_field.send_keys(USER)

        print("Correo escrito. Esperando 2 segundos...")

        time.sleep(2) # Pausa tras escribir el correo

        # 4. Escribir la Contraseña

        password_field = wait.until(EC.element_to_be_clickable((By.ID, "login-password")))

        password_field.send_keys(PASSWORD)

        print("Contraseña escrita. Esperando 2 segundos antes de entrar...")

        time.sleep(2) # Pausa tras escribir la clave

        # 5. Clic en Entrar

        login_button = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(text(), 'Entrar')]")))

        login_button.click()

        print("¡Login enviado!")

        time.sleep(10) # Pausa final larga para ver si entraste a la tienda

    except Exception as e:

        print(f"❌ Error: {e}")

    finally:

        driver.quit()
 
 
 
 
# --- EJECUTAR EL SCRIPT ---

if __name__ == "__main__":

    main()



 
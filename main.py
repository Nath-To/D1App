from webdriver_manager.chrome import ChromeDriverManager
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait as Wait
import time

# Credenciales de prueba
USER = "elidreyes@correo.com"
PASSWORD = "elidreyes"

def main():
    service = Service(ChromeDriverManager().install())

    options = webdriver.ChromeOptions()
    options.add_argument("--window-size=1920,1080")
    # ✅ Estas opciones son OBLIGATORIAS para que funcione en GitHub Actions
    options.add_argument("--headless")         # Sin pantalla gráfica
    options.add_argument("--no-sandbox")       # Requerido en Linux/CI
    options.add_argument("--disable-dev-shm-usage")  # Evita errores de memoria

    driver = webdriver.Chrome(service=service, options=options)
    wait = Wait(driver, 10)

    try:
        # 1. Abrir la App
        driver.get("http://localhost:3000")
        print("✅ Página cargada")
        time.sleep(3)

        # 2. Clic en botón "Iniciar sesión" del header para ir a la pantalla de auth
        btn_login = wait.until(EC.element_to_be_clickable((By.ID, "btn-show-login")))
        btn_login.click()
        print("✅ Pantalla de login abierta")
        time.sleep(2)

        # 3. Escribir el Correo
        email_field = wait.until(EC.element_to_be_clickable((By.ID, "login-email")))
        email_field.send_keys(USER)
        print(f"✅ Correo escrito: {USER}")
        time.sleep(1)

        # 4. Escribir la Contraseña
        password_field = wait.until(EC.element_to_be_clickable((By.ID, "login-password")))
        password_field.send_keys(PASSWORD)
        print("✅ Contraseña escrita")
        time.sleep(1)

        # 5. Clic en el botón Entrar (dentro del formulario)
        login_button = wait.until(EC.element_to_be_clickable(
            (By.CSS_SELECTOR, "#form-login button[type='submit']")
        ))
        login_button.click()
        print("✅ Formulario enviado")
        time.sleep(4)

        # 6. Verificar que el login fue exitoso
        # Si el menú de usuario aparece, el login funcionó
        user_menu = driver.find_element(By.ID, "user-menu")
        if user_menu.is_displayed():
            print("🎉 LOGIN EXITOSO - El menú de usuario está visible")
        else:
            print("❌ LOGIN FALLIDO - El menú de usuario no apareció")
            raise Exception("Login no fue exitoso")

    except Exception as e:
        print(f"❌ Error durante la prueba: {e}")
        raise  # Re-lanza el error para que GitHub Actions lo marque como fallido

    finally:
        driver.quit()
        print("🔒 Navegador cerrado")

if __name__ == "__main__":
    main()



 